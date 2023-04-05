import { Request, Response } from 'express';
import { PlayerItem, PlayerUnit, CasualtiesResult, UnitType, AttackPlayerUnit } from '../../../types/typings';
import { AttackLogStats, AttackLogData } from '../../daos/attackLog';
import UserModel from '../../models/user';
var binomial = require('@stdlib/random-base-binomial');

function canAttack(AttackLevel: number, DefenseLevel: number) {
  if (DefenseLevel > AttackLevel + 5) return false;
  else if (DefenseLevel < AttackLevel - 5) return false;
  else return true;
}

// Ported from old ezRPG 1.2.x Attack module
// Clone of the PHP Rand function
const rand = (
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const calculateHPResults = (attacker: UserModel, isAttackerVictor: boolean, defender: UserModel) => {
  const attackerHP = isAttackerVictor
    ? attacker.fortHitpoints
    : attacker.fortHitpoints - defender.offense / 10;

  const defenderHP = defender.fortHitpoints - attacker.offense / 10;
  
  return {
    attacker: Math.max(attackerHP, 0),
    defender: Math.max(defenderHP, 0),
  };
};

const calculateDamage = (
  attacker: UserModel,
  defender: UserModel,
  turnsAmount: number
): number => {
  const baseDamage = rand(attacker.offense - 1, attacker.offense + 1);
  const damageMultiplier = getAttackMultiplier(attacker.level, defender.level);
  const turnMultiplier = turnsAmount / 10;
  const finalDamage = Math.floor(
    baseDamage * damageMultiplier * turnMultiplier
  );

  return finalDamage;
};

function getAttackMultiplier(
  attackerLevel: number,
  defenderLevel: number
): number {
  const levelDifference = Math.abs(attackerLevel - defenderLevel);
  const attackMultipliers = [1, 0.5, 0.8, 1.2, 1.5, 2];

  return attackMultipliers[Math.min(levelDifference, 5)];
}

const calculateSideCasualties = (
  units: PlayerUnit[],
  items: PlayerItem[],
  enemyLevel: number
): AttackPlayerUnit[] => {
  return units.map((unit) => {
    const item = items.find((item) => item.level === unit.level);

    const equippedRatio =
      item && item.quantity >= unit.quantity
        ? 1
        : unit.quantity > 0
        ? item.quantity / unit.quantity
        : 0;
    const baseCasualtyRate =
      enemyLevel >= unit.level ? 1 - unit.level / enemyLevel : 0;
    const finalCasualtyRate = baseCasualtyRate * (1 - 0.5 * equippedRatio);
    const binomialDistribution = binomial(unit.quantity, finalCasualtyRate);
    const numberOfCasualties = Math.round(binomialDistribution);
    console.log('num: ', numberOfCasualties);
    return { ...unit, casualties: numberOfCasualties };
  });
};

const calculateCasualties = (
  attackerUnits: PlayerUnit[],
  defenderUnits: PlayerUnit[],
  attackerItems: PlayerItem[],
  defenderItems: PlayerItem[],
  attackerLevel: number,
  defenderLevel: number
): CasualtiesResult => {
  const attackerCasualties = calculateSideCasualties(
    attackerUnits,
    attackerItems,
    defenderLevel
  );
  const defenderCasualties = calculateSideCasualties(
    defenderUnits,
    defenderItems,
    attackerLevel
  );

  return { attackerCasualties, defenderCasualties };
};

const calculateFortLevelConstant = (fortLevel: number): number => {
  return (
    -2 * 10 ** -7 * fortLevel ** 6 +
    1 * 10 ** -5 * fortLevel ** 5 -
    0.0003 * fortLevel ** 4 +
    0.0016 * fortLevel ** 3 +
    0.0135 * fortLevel ** 2 +
    0.0521 * fortLevel +
    0.1295
  );
};
function calculateXPEarned(
  attackerDamage: number,
  defenderDamage: number,
  turnsAmount: number,
  attackerOffensiveUnits: number,
  defenderDefensiveUnits: number
): number {
  const damageRatio = Math.max(attackerDamage / defenderDamage, 1);
  const unitRatio = attackerOffensiveUnits / defenderDefensiveUnits;
  const cappedUnitRatio = Math.min(Math.max(unitRatio * 10, 6), 14);
  const rv = rand(
    0.25 + 0.016 * (cappedUnitRatio - 6),
    0.25 + 0.016 * (cappedUnitRatio - 6 + 1)
  );
  return Math.floor(
    100 * turnsAmount * Math.abs(Math.cos(10 * damageRatio) / rv)
  );
}

const updateAttackAndDefenseStats = (
  attacker: any,
  defender: any,
  hpResult: { attacker: number; defender: number },
  fortDamageDealt: number
): void => {
  attacker.fortHealth.current = hpResult.attacker;
  defender.fortHealth.current = hpResult.defender;
  defender.fortHealth.current -= fortDamageDealt;
};

function calculateRandomDamageDealt(
  fortLevelConstant: number,
  attackerDamage: number
): number {
  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  let randomDamageDealt = 0;
  if (fortLevelConstant >= 0) {
    randomDamageDealt =
      rand(-1, 1) + Math.floor(fortLevelConstant * attackerDamage);
  } else {
    randomDamageDealt = rand(-1, 1);
  }

  return randomDamageDealt;
}

function createAttackLogData(
  attacker: any,
  defender: any,
  winner: any,
  stats: AttackLogStats[],
  timestamp: Date
): AttackLogData {
  return {
    attacker_id: attacker.id,
    defender_id: defender.id,
    winner: winner.id,
    stats: stats,
    timestamp: timestamp,
  };
}

async function applyAttackResults(
  attacker: any,
  defender: any,
  xpResult: any,
  hpResult: any,
  fortDamageDealt: number,
  winner: any,
  availablePillage: number,
  attackLogData: AttackLogData
) {
  // Update attacker and defender objects
  attacker.fortHealth.current = hpResult.attacker;
  defender.fortHealth.current = hpResult.defender;
  defender.fortHealth.current -= fortDamageDealt;

  const earnedNewLevel =
    attackLogData.stats[0].xpEarned >= attacker.xpToNextLevel;

  if (
    attackLogData.stats[0].xpEarned !== 0 ||
    !Number.isNaN(attackLogData.stats[0].xpEarned)
  ) {
    attacker.addXP(attackLogData.stats[0].xpEarned);
  }

  if (winner === attacker) {
    if (defender.gold != 0) {
      await attacker.addGold(availablePillage);
      await defender.subtractGold(availablePillage);
    }
  }
}


async function renderAttackPage(req: Request, res: Response) {
  const attacker = await req.modelFactory.user.fetchById(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    req.user.id
  );

  const defender = await req.modelFactory.user.fetchById(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    parseInt(req.params.id)
  );

  if (!canAttack(attacker.level, defender.level) || attacker.offense == 0) {
    const err =
      defender.level <= attacker.level - 5
        ? 'TooLow'
        : defender.level >= attacker.level + 5
        ? 'TooHigh'
        : 'NoOffense';
    res.redirect(`/userprofile/${defender.id}?err=${err}`);
  }

  res.render('page/main/attack/turns', {
    layout: 'main',
    pageTitle: `Attack ${defender.id}`,
    menu_category: 'battle',
    menu_link: 'attack',
    sidebarData: req.sidebarData,
    userDataFiltered: await req.user.formatUsersStats(req.user),
    turns: attacker.attackTurns,
    defender: defender,
  });
}

const handleAttack = async (req: Request, res: Response) => {
  const defender = await req.modelFactory.user.fetchById(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    parseInt(req.params.id)
  );
  const attacker = req.user;
  const turnsAmount = req.body?.turnsAmount;
  const defenderStartingHp = defender.fortHitpoints;

  // Calculate attacker and defender damage
  const attackerDamage = calculateDamage(attacker, defender, turnsAmount);
  const defenderDamage = calculateDamage(defender, attacker, turnsAmount);

  // Calculate fort damage from attacking
  const fortLevel = defender.fortLevel;
  const fortLevelConstant = calculateFortLevelConstant(fortLevel);
  const randomDamageDealt = calculateRandomDamageDealt(
    fortLevelConstant,
    attackerDamage
  );
  const fortDamageDealt =
    (attackerDamage / defenderDamage) * defender.fortLevel + randomDamageDealt;

  // Calculate XP earned from attacking
  const attackerOffensiveUnits = attacker.unitTotals.offense;
  const defenderDefensiveUnits = defender.unitTotals.defense;
  const xpEarned = calculateXPEarned(
    attackerDamage,
    defenderDamage,
    turnsAmount,
    attackerOffensiveUnits,
    defenderDefensiveUnits
  );

  // Calculate HP and XP results
  const hpResult = calculateHPResults(attacker, true, defender);
  const xpResult = {
    defender: {
      hp: hpResult.defender,
      xp: xpEarned * (turnsAmount / 10),
    },
    attacker: {
      hp: hpResult.attacker,
      xp: xpEarned * (turnsAmount / 10),
    },
  };

  // Retrieve attacker and defender units and items
  const attackerUnits = attacker.units.filter((x) => x.type == 'OFFENSE');
  const defenderUnits = defender.units.filter((x)=> x.type == 'DEFENSE');
  const attackerItems = attacker.items.filter(x=>x.unitType == 'OFFENSE');
  const defenderItems = defender.items.filter(x=>x.unitType == 'DEFENSE');

  // Calculate casualties for both attacker and defender
  const { attackerCasualties, defenderCasualties } = calculateCasualties(
    attackerUnits,
    defenderUnits,
    attackerItems,
    defenderItems,
    attacker.level,
    defender.level
  );


  // Update units with the casualties
  attacker.killUnits(attackerCasualties);

  defender.killUnits(defenderCasualties);
  
  // Update attacker and defender objects
  attacker.fortHealth.current = hpResult.attacker;
  defender.fortHealth.current = hpResult.defender;
  defender.fortHealth.current -= fortDamageDealt;

  // Determine winner and available pillage
  const winner = attacker.offense > defender.defense ? attacker : defender;
  const availablePillage =
    Math.floor(Math.random() * (defender.gold * 0.8 + 1)) *
    (parseInt(req.body.turnsAmount) / 100);

  // Create attack log data
   const stats: AttackLogStats[] = [
     {
       offensePoints: attacker.offense,
       defensePoints: defender.defense,
       pillagedGold: Math.floor(winner === attacker ? availablePillage : 0),
       xpEarned: Math.round(xpResult.attacker.xp),
       offenseXPStart: attacker.experience,
       hpDamage: hpResult.defender,
       offenseUnitsCount: 0,
       offenseUnitsLost: [],
       defenseUnitsCount: 0,
       defenseUnitsLost: [],
     },
   ];
  const attackLogData: AttackLogData = createAttackLogData(
    attacker,
    defender,
    winner,
    stats,
    new Date()
  );

  // Apply attack results
  await applyAttackResults(
    attacker,
    defender,
    xpResult,
    hpResult,
    fortDamageDealt,
    winner,
    availablePillage,
    attackLogData
  );
  const earnedNewLevel =
    stats[0].xpEarned >= attacker.xpToNextLevel ? true : false;
  if (stats[0].xpEarned !== 0 || !Number.isNaN(stats[0].xpEarned))
    attacker.addXP(stats[0].xpEarned);

  
  
  await req.modelFactory.attackLog.createHistory(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    attackLogData
  );

  res.render('page/main/attack/stat', {
    layout: 'main',
    pageTitle: 'Attack Results',
    menu_category: 'battle',
    menu_link: 'war_history',
    sidebarData: req.sidebarData,
    userDataFiltered: await req.user.formatUsersStats(req.user),
    winner: winner,
    attacker: {
      id: attacker.id,
      displayName: attacker.displayName,
      offense: Math.floor(attacker.offense),
      level: attacker.level,
    }, //TODO: the UserData isn't being passed, so this is a crude workaround for now
    defender: {
      id: defender.id,
      displayName: defender.displayName,
      defense: Math.floor(defender.defense),
      level: defender.level,
    }, //TODO: the UserData isn't being passed, so this is a crude workaround for now
    won: winner.id === attacker.id ? true : false,
    turns: parseInt(req.body?.turnsAmount),
    stats: stats[0],
    earnedNewLevel: earnedNewLevel,
    newLevel: attacker.level + 1,
  });

  return {
    attacker,
    defender,
    xp: xpResult,
    fortDamageDealt,
    damage: {
      attacker: attackerDamage,
      defender: defenderDamage,
    },
    startingHp: {
      attacker: attacker.fortHealth.current + attackerDamage,
      defender: defenderStartingHp,
    },
    endingHp: {
      attacker: hpResult.attacker,
      defender: hpResult.defender,
    },
  };
};

async function renderAttackLogPage(req: Request, res: Response) {
  const battleID = req.params.id;
  const battleLog = await req.modelFactory.attackLog.fetchByID(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    parseInt(battleID)
  );
  const attacker = await req.modelFactory.user.fetchById(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    battleLog.attacker_id
  );
  const defender = await req.modelFactory.user.fetchById(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    battleLog.defender_id
  );
  res.render('page/main/attack/stat', {
    layout: 'main',
    pageTitle: 'Attack Results',
    sidebarData: req.sidebarData,
    menu_category: 'battle',
    menu_link: 'war_history',
    winner: battleLog.winner,
    userDataFiltered: await req.user.formatUsersStats(req.user),
    attacker: {
      id: attacker.id,
      displayName: attacker.displayName,
      offense: attacker.offense,
      level: attacker.level,
    }, //TODO: the UserData isn't being passed, so this is a crude workaround for now
    defender: {
      id: defender.id,
      displayName: defender.displayName,
      defense: defender.defense,
      level: defender.level,
    }, //TODO: the UserData isn't being passed, so this is a crude workaround for now
    won: battleLog.winner === attacker.id ? true : false,
    turns: parseInt(req.body?.turnsAmount),
    stats: battleLog.stats,
  });
}

async function renderAttackList(req: Request, res: Response) {
  const players = await req.modelFactory.user.fetchAll(
    req.modelFactory,
    req.daoFactory,
    req.logger
  );

  const user = await req.modelFactory.user.fetchById(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    req.user.id
  );

  res.render('page/main/attack/list', {
    layout: 'main',
    pageTitle: 'Attack List',
    sidebarData: req.sidebarData,
    userDataFiltered: await req.user.formatUsersStats(req.user),
    menu_category: 'battle',
    menu_link: 'attack',

    players: players.map((player) => ({
      id: player.id,
      rank: player.rank,
      displayName: player.displayName,
      gold: new Intl.NumberFormat('en-GB').format(player.gold),
      armySize: new Intl.NumberFormat('en-GB').format(player.armySize),
      level: player.level,
      race: player.race,
      is_player: player.id == user.id,
    })),
  });
}

async function testAttack(req: Request, res: Response) {
  const defender = await req.modelFactory.user.fetchById(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    parseInt(req.params.id)
  );
  const attacker = await req.modelFactory.user.fetchById(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    req.user.id
  );

  if (!canAttack(attacker.level, defender.level) || attacker.offense == 0) {
    const err =
      defender.level <= attacker.level - 5
        ? 'TooLow'
        : defender.level >= attacker.level + 5
        ? 'TooHigh'
        : 'NoOffense';
    return res.json({ err: err });
  }

  const attackQuota = await req.modelFactory.attackLog.canAttackUser(
    req.modelFactory,
    req.daoFactory,
    req.logger,
    defender,
    attacker
  );
  if (attackQuota === false) {
    const err = 'TooMany';
    return res.json({ err: err });
  }
  const winner = attacker.offense > defender.defense ? attacker : defender;
  const availablePillage =
    Math.floor(Math.random() * (defender.gold * 0.8 + 1)) *
    (parseInt(req.body.turnsAmount) / 10);

  // Level Mitigation - Courtesy of LuK
  // Check the level difference for mitigation
  let levelMitigation = 0;
  if (attacker.level > defender.level + 5) {
    levelMitigation = Math.pow(0.96, attacker.level - defender.level - 5);
  } else {
    levelMitigation = 1.0;
  }

  return res.json({
    msg: 'hi ' + req.user.displayName,
    winner: winner.displayName,
    attacker: attacker.displayName,
    defender: defender.displayName,
    defenderUnitDefense: defender.unitTotals[0].defense,
    attackerUnitOffense: attacker.unitTotals[0].offense,
    AttackerOffense: attacker.offense,
    DefenderDefense: defender.defense,
    levelMitigation: levelMitigation,
    defenderFortHealth: defender.fortHealth.percentage,
    defenderFortLevel: defender.fortLevel,
    defenderGold: defender.gold,
    availablePillage: availablePillage,
  });
}

export default {
  renderAttackList,
  renderAttackLogPage,
  renderAttackPage,
  handleAttack,
  testAttack,
};
