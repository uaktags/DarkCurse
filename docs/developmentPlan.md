---
title: "Development Plan"
layout: page
permalink: /devplan/
---
In order to have some sembance of game play sooner rather than later. I am
splitting the development into multiple phases. The goal is to have milestones
that can be worked towards.

## Pre-Alpha (Initial Game)

The main focus of this version is to allow players to be able to experience the
code game play. The game itself will be very limited and will mostly only work
with solo play.

- [X] Initial game architecture
- [!] Player Accounts
  - [X] Create new accounts
  - [X] Login to an existing account
  - [!] Logout (including option to expire all sessions across devices)
- [X] Economy
  - [X] Worker units generate gold every turn
  - [X] Fortification generates gold every turn
  - [X] Gold can be deposited into the bank for safe keeping
- [X] Training Units
  - [X] Citizens can be trained into different units
  - [X] Level 1 units can be untrained back to citizens
- [X] Fortification
  - [X] Players receive new citizens every day
  - [X] Damaged fortifications can be repaired
- [ ] Military
  - [X] Players accumulate attack turns every 30 minutes
  - [X] Players can attack each other
  - [X] The number of used attack turns has an impact of the gained XP and Gold.
  - [X] Players can only attack within a relative range of levels.
  - [ ] Players can inflict damage on targetted Player's Fortification by having a great enough offense advantage.
  - [ ] Players can "Spy" on other players using attack turns and Spy units.
  - [ ] Intel gathered from Spying gets logged into a Spy List.
  - [X] Players can defend against spies by enlisting "Sentry" units.
- [ ] Messaging
  - [X] Players can send messages to other players by clicking option in player's profile.
  - [X] Players can receive messages from other players.
  - [ ] Players can reply to a received message.
  - [X] Players can see the messages they've received in their Inbox