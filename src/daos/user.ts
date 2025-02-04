import { Knex } from 'knex';
import {
  PlayerClass,
  PlayerRace,
  PlayerUnit,
  PlayerItem,
} from '../../types/typings';

/**
 * This is essentially documentation for the structure of the data in the
 * database.
 */
interface UserRow {
  id: number;
  display_name: string;
  email: string;
  salt: string;
  password_hash: string;
  race: string;
  class: string;
  units: string;
  items: string;
  experience: string;
  gold: string;
  gold_in_bank: string;
  fort_level: number;
  fort_hitpoints: number;
  house_level: number;
  attack_turns: string;
  created_date: Date;
  updated_date: Date;
  last_active: Date;
  rank: number;
  bio: string;
  colorScheme: string;
}

interface MessagesRow {
  id: number;
  subject: string;
  from_user_id: number;
  to_user_id: number;
  date_time: Date;
  created_date: Date;
  updated_date: Date;
  body: string;
}

export interface MessageData {
  id: number;
  subject: string;
  from_user: UserData;
  to_user: UserData;
  date_time: string;
  body: string;
}

export interface UserData {
  id: number;
  displayName: string;
  email: string;
  passwordHash: string;
  salt: string;
  race: PlayerRace;
  class: PlayerClass;
  units: PlayerUnit[];
  items: PlayerItem[];
  experience: number;
  gold: number;
  goldInBank: number;
  fortLevel: number;
  fortHitpoints: number;
  houseLevel: number;
  attackTurns: number;
  last_active: Date;
  rank: number;
  bio: string;
  colorScheme: string;
}

class UserDao {
  private database: Knex;

  constructor(database: Knex) {
    this.database = database;
  }

  async createUser(
    email: string,
    password: string,
    salt: string,
    race: string,
    class_name: string,
    display_name: string
  ): Promise<UserData | null> {
    const userRow = await this.fetchByEmail(email);
    if (userRow) return null;
    const nuser = {
      display_name: display_name,
      email: email,
      password_hash: password,
      salt: salt,
      race: race,
      class: class_name,
      fort_hitpoints: 50,
    };
    await this.database.insert(nuser).into('users');
    return await this.fetchByEmail(email);
  }

  //deprecated: see fetchAll
  //this sub query may need to be re-thought to something that stores into the db rather than alot of subqueries.
  async fetchRank(id: number): Promise<number> {
    const rank = await this.database<UserRow>('users')
      .column('rank')
      .from(
        this.database.raw(
          '(select id, row_number() OVER (ORDER BY experience desc, display_name) as rank from users) as ranks'
        )
      )
      .where('id', id);
    return rank[0].rank;
  }

  async fetchRecruitingLink(id: number): Promise<string> {
    const link = await this.database<UserRow>('users')
      .column('link')
      .from(
        this.database.raw(
          '(select md5(row(id)::TEXT) as link, id from users) as link'
        )
      )
      .where('id', id);
    return link[0].link;
  }

  async fetchIDByRecruitingLink(recruitId: string): Promise<number> {
    const link = await this.database<UserRow>('users')
      .column('id')
      .from(
        this.database.raw(
          '(select md5(row(id)::TEXT) as link, id from users) as link'
        )
      )
      .where('link', recruitId);
    return link[0].id;
  }

  // SELECT row_number FROM
  //	(
  //		SELECT id, row_number() OVER (ORDER BY experience desc, display_name) FROM users
  // ) AS bar*/

  async fetchById(id: number): Promise<UserData | null> {
    const userRow = await this.database<UserRow>('users')
      .where({ id: id })
      .first();
    if (!userRow) return null;
    return this.mapUserRowToUserData(userRow);
  }

  async fetchByEmail(email: string): Promise<UserData | null> {
    const userRow = await this.database<UserRow>('users')
      .where({ email: email })
      .first();
    if (!userRow) return null;
    return this.mapUserRowToUserData(userRow);
  }

  async fetchByDisplayName(display_name: string): Promise<UserData | null> {
    const userRow = await this.database<UserRow>('users')
      .where({ display_name: display_name })
      .first();
    if (!userRow) return null;
    return this.mapUserRowToUserData(userRow);
  }

  async fetchAll(): Promise<UserData[]> {
    const userRows = await this.database<UserRow>('users')
      .select()
      .from(
        this.database.raw(
          '(select *, row_number() OVER (ORDER BY experience desc, display_name) as rank from users) as ranks'
        )
      );
    return userRows.map(this.mapUserRowToUserData);
  }

  async getSalt(userId: number): Promise<string> {
    const userRow = await this.database<UserRow>('users')
      .where({ id: userId })
      .first();
    if (!userRow) return null;
    return userRow.salt;
  }

  async setLastActive(userId: number): Promise<void> {
    await this.database<UserRow>('users')
      .where({ id: userId })
      .andWhere('last_active', '<', new Date(new Date().getTime() - 300000))
      .update({ last_active: new Date() });
  }

  async setGold(userId: number, gold: number): Promise<void> {
    await this.database<UserRow>('users')
      .where({ id: userId })
      .update({ gold: Math.round(gold).toString() });
  }

  async setFortHP(userId: number, hp: number): Promise<void> {
    console.log(hp);
    await this.database<UserRow>('users')
      .where({ id: userId })
      .update({ fort_hitpoints: Math.round(hp) });
  }

  async setTurns(userId: number, turns: number): Promise<void> {
    await this.database<UserRow>('users')
      .where({ id: userId })
      .update({ attack_turns: turns.toString() });
  }

  async setXP(userId: number, xp: number): Promise<void> {
    console.log(xp);
    await this.database<UserRow>('users')
      .where({ id: userId })
      .update({ experience: xp.toString() });
  }

  async setBankedGold(userId: number, goldInBank: number): Promise<void> {
    await this.database<UserRow>('users')
      .where({ id: userId })
      .update({ gold_in_bank: goldInBank.toString() });
  }

  async setUnits(userId: number, units: PlayerUnit[]): Promise<void> {
    await this.database<UserRow>('users')
      .where({ id: userId })
      .update({
        // https://knexjs.org/#:~:text=For%20PostgreSQL%2C%20due%20to%20incompatibility%20between%20native%20array%20and%20json%20types%2C%20when%20setting%20an%20array%20(or%20a%20value%20that%20could%20be%20an%20array)%20as%20the%20value%20of%20a%20json%20or%20jsonb%20column%2C%20you%20should%20use%20JSON.stringify()%20to%20convert%20your%20value%20to%20a%20string%20prior%20to%20passing%20it%20to%20the%20query%20builder%2C%20e.g.
        units: JSON.stringify(units),
      });
  }

  async setItems(userId: number, items: PlayerItem[]): Promise<void> {
    await this.database<UserRow>('users')
      .where({ id: userId })
      .update({
        // https://knexjs.org/#:~:text=For%20PostgreSQL%2C%20due%20to%20incompatibility%20between%20native%20array%20and%20json%20types%2C%20when%20setting%20an%20array%20(or%20a%20value%20that%20could%20be%20an%20array)%20as%20the%20value%20of%20a%20json%20or%20jsonb%20column%2C%20you%20should%20use%20JSON.stringify()%20to%20convert%20your%20value%20to%20a%20string%20prior%20to%20passing%20it%20to%20the%20query%20builder%2C%20e.g.
        items: JSON.stringify(items),
      });
  }

  async setColorScheme(userId: number, colorScheme: PlayerRace): Promise<void> {
    await this.database<UserRow>('users').where({ id: userId }).update({
      colorScheme: colorScheme,
    });
  }

  async updatePassword(userId: number, password_hash: string): Promise<void> {
    await this.database<UserRow>('user').where({ id: userId }).update({
      password_hash: password_hash,
    });
  }

  async fetchMessages(userId: number): Promise<MessageData[]> {
    const messageRows = await this.database<MessagesRow>('messages').where({
      to_user_id: userId,
    });
    const messages: MessageData[] = [];
    for (let i = 0; i < messageRows.length; i++) {
      messages.push({
        id: messageRows[i].id,
        date_time: messageRows[i].date_time.toLocaleString(),
        subject: messageRows[i].subject,
        body: messageRows[i].body,
        to_user: await this.fetchById(messageRows[i].to_user_id),
        from_user: await this.fetchById(messageRows[i].from_user_id),
      });
    }
    return messages;
  }

  async fetchMessageById(msgId: number): Promise<MessageData> {
    const messageRow = await this.database<MessagesRow>('messages')
      .where({
        id: msgId,
      })
      .first();
    return {
      id: messageRow.id,
      subject: messageRow.subject,
      to_user: await this.fetchById(messageRow.to_user_id),
      from_user: await this.fetchById(messageRow.from_user_id),
      body: messageRow.body,
      date_time: messageRow.date_time.toLocaleString(),
    };
  }

  mapUserRowToUserData(userRow: UserRow): UserData {
    return {
      id: userRow.id,
      displayName: userRow.display_name,
      email: userRow.email,
      passwordHash: userRow.password_hash,
      salt: userRow.salt,
      race: userRow.race as PlayerRace,
      class: userRow.class as PlayerClass,
      units:
        typeof userRow.units === 'string'
          ? JSON.parse(userRow.units)
          : userRow.units,
      items:
        typeof userRow.items === 'string'
          ? JSON.parse(userRow.items)
          : userRow.items,
      experience: parseInt(userRow.experience),
      gold: parseInt(userRow.gold),
      goldInBank: parseInt(userRow.gold_in_bank),
      fortLevel: userRow.fort_level,
      houseLevel: userRow.house_level,
      fortHitpoints: userRow.fort_hitpoints,
      attackTurns: parseInt(userRow.attack_turns),
      last_active: userRow.last_active,
      rank: userRow.rank,
      bio: userRow.bio,
      colorScheme: userRow.colorScheme,
    };
  }
}

export default UserDao;
