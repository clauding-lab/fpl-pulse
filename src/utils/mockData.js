export function generateMockData() {
  const teams = [
    { id: 1, name: "Arsenal", short_name: "ARS" },
    { id: 2, name: "Aston Villa", short_name: "AVL" },
    { id: 3, name: "Bournemouth", short_name: "BOU" },
    { id: 4, name: "Brentford", short_name: "BRE" },
    { id: 5, name: "Brighton", short_name: "BHA" },
    { id: 6, name: "Chelsea", short_name: "CHE" },
    { id: 7, name: "Crystal Palace", short_name: "CRY" },
    { id: 8, name: "Everton", short_name: "EVE" },
    { id: 9, name: "Fulham", short_name: "FUL" },
    { id: 10, name: "Ipswich", short_name: "IPS" },
    { id: 11, name: "Leicester", short_name: "LEI" },
    { id: 12, name: "Liverpool", short_name: "LIV" },
    { id: 13, name: "Man City", short_name: "MCI" },
    { id: 14, name: "Man Utd", short_name: "MUN" },
    { id: 15, name: "Newcastle", short_name: "NEW" },
    { id: 16, name: "Nott'm Forest", short_name: "NFO" },
    { id: 17, name: "Southampton", short_name: "SOU" },
    { id: 18, name: "Spurs", short_name: "TOT" },
    { id: 19, name: "West Ham", short_name: "WHU" },
    { id: 20, name: "Wolves", short_name: "WOL" },
  ];

  const mockPlayers = [
    { name: "Salah", team: 12, pos: 3, price: 133, form: "8.2", pts: 218, goals: 19, assists: 13, xG: "16.4", xA: "10.2", xGC: "8.1", mins: 2520, bps: 680, bonus: 32, own: "72.3", cop: null, yc: 2, code: 118748 },
    { name: "Haaland", team: 13, pos: 4, price: 148, form: "7.8", pts: 198, goals: 22, assists: 4, xG: "20.1", xA: "3.8", xGC: "0", mins: 2340, bps: 590, bonus: 28, own: "68.1", cop: null, yc: 3, code: 495688 },
    { name: "Palmer", team: 6, pos: 3, price: 114, form: "6.9", pts: 185, goals: 14, assists: 10, xG: "12.8", xA: "8.9", xGC: "5.2", mins: 2610, bps: 520, bonus: 25, own: "55.8", cop: null, yc: 4, code: 556459 },
    { name: "Saka", team: 1, pos: 3, price: 105, form: "6.4", pts: 172, goals: 11, assists: 12, xG: "9.3", xA: "10.1", xGC: "3.8", mins: 2430, bps: 480, bonus: 22, own: "44.2", cop: null, yc: 3, code: 223340 },
    { name: "Isak", team: 15, pos: 4, price: 92, form: "7.1", pts: 165, goals: 16, assists: 5, xG: "14.8", xA: "4.2", xGC: "0", mins: 2250, bps: 430, bonus: 20, own: "38.5", cop: null, yc: 1, code: 467169 },
    { name: "Son", team: 18, pos: 3, price: 100, form: "5.8", pts: 152, goals: 12, assists: 8, xG: "10.5", xA: "7.8", xGC: "4.1", mins: 2340, bps: 410, bonus: 19, own: "25.3", cop: null, yc: 2, code: 85971 },
    { name: "Watkins", team: 2, pos: 4, price: 86, form: "6.2", pts: 148, goals: 13, assists: 7, xG: "12.1", xA: "6.3", xGC: "0", mins: 2430, bps: 390, bonus: 18, own: "22.1", cop: null, yc: 3, code: 214048 },
    { name: "Gordon", team: 15, pos: 3, price: 76, form: "5.5", pts: 138, goals: 8, assists: 9, xG: "6.9", xA: "8.1", xGC: "3.5", mins: 2520, bps: 370, bonus: 16, own: "18.7", cop: null, yc: 4, code: 480738 },
    { name: "Saliba", team: 1, pos: 2, price: 62, form: "5.8", pts: 142, goals: 3, assists: 2, xG: "2.1", xA: "1.4", xGC: "24.2", mins: 2700, bps: 510, bonus: 24, own: "32.4", cop: null, yc: 5, code: 444145 },
    { name: "Gabriel", team: 1, pos: 2, price: 60, form: "5.2", pts: 135, goals: 4, assists: 1, xG: "3.2", xA: "0.8", xGC: "24.0", mins: 2610, bps: 480, bonus: 22, own: "28.9", cop: null, yc: 6, code: 209899 },
    { name: "Alexander-Arnold", team: 12, pos: 2, price: 72, form: "5.9", pts: 140, goals: 2, assists: 8, xG: "1.8", xA: "6.5", xGC: "22.1", mins: 2250, bps: 430, bonus: 20, own: "34.1", cop: null, yc: 3, code: 169187 },
    { name: "Flekken", team: 4, pos: 1, price: 47, form: "4.8", pts: 128, goals: 0, assists: 0, xG: "0", xA: "0", xGC: "35.8", mins: 2700, bps: 440, bonus: 18, own: "15.2", cop: null, yc: 1, code: 171314 },
    { name: "Mbeumo", team: 4, pos: 3, price: 78, form: "5.3", pts: 145, goals: 11, assists: 7, xG: "9.8", xA: "5.6", xGC: "4.2", mins: 2520, bps: 400, bonus: 19, own: "21.5", cop: null, yc: 2, code: 346498 },
    { name: "Munoz", team: 7, pos: 2, price: 48, form: "4.5", pts: 112, goals: 2, assists: 5, xG: "1.2", xA: "3.8", xGC: "28.5", mins: 2430, bps: 350, bonus: 14, own: "12.8", cop: null, yc: 3, code: 600342 },
    { name: "Rogers", team: 2, pos: 3, price: 54, form: "5.1", pts: 118, goals: 6, assists: 6, xG: "4.8", xA: "4.2", xGC: "3.1", mins: 2160, bps: 310, bonus: 13, own: "8.4", cop: null, yc: 2, code: 589342 },
    { name: "Wissa", team: 4, pos: 4, price: 62, form: "5.6", pts: 124, goals: 10, assists: 3, xG: "8.5", xA: "2.4", xGC: "0", mins: 2070, bps: 320, bonus: 14, own: "6.8", cop: null, yc: 1, code: 463871 },
    { name: "Dibling", team: 17, pos: 3, price: 46, form: "4.2", pts: 82, goals: 4, assists: 3, xG: "5.8", xA: "4.1", xGC: "5.2", mins: 1980, bps: 250, bonus: 10, own: "2.1", cop: null, yc: 2, code: 615841 },
    { name: "Ait-Nouri", team: 20, pos: 2, price: 48, form: "4.8", pts: 108, goals: 3, assists: 4, xG: "2.1", xA: "3.2", xGC: "30.1", mins: 2520, bps: 340, bonus: 14, own: "5.5", cop: null, yc: 4, code: 498498 },
    { name: "Joao Pedro", team: 5, pos: 4, price: 57, form: "4.9", pts: 110, goals: 8, assists: 4, xG: "7.2", xA: "3.8", xGC: "0", mins: 2070, bps: 290, bonus: 12, own: "4.2", cop: null, yc: 2, code: 559394 },
    { name: "Nkunku", team: 6, pos: 3, price: 63, form: "4.6", pts: 98, goals: 7, assists: 3, xG: "8.9", xA: "4.5", xGC: "2.1", mins: 1620, bps: 260, bonus: 11, own: "3.8", cop: 75, yc: 1, code: 209807 },
    { name: "Cunha", team: 20, pos: 4, price: 72, form: "6.8", pts: 155, goals: 13, assists: 8, xG: "10.2", xA: "6.8", xGC: "0", mins: 2430, bps: 420, bonus: 20, own: "28.2", cop: null, yc: 5, code: 467434 },
    { name: "Robinson", team: 9, pos: 2, price: 46, form: "4.3", pts: 95, goals: 1, assists: 3, xG: "0.8", xA: "2.5", xGC: "31.2", mins: 2340, bps: 310, bonus: 12, own: "3.1", cop: null, yc: 3, code: 442421 },
    { name: "Luis Diaz", team: 12, pos: 3, price: 78, form: "4.1", pts: 130, goals: 10, assists: 5, xG: "8.2", xA: "4.8", xGC: "2.8", mins: 2160, bps: 330, bonus: 14, own: "14.2", cop: null, yc: 2, code: 475089 },
    { name: "Martinez", team: 2, pos: 1, price: 52, form: "4.2", pts: 118, goals: 0, assists: 1, xG: "0", xA: "0.3", xGC: "32.5", mins: 2520, bps: 420, bonus: 16, own: "18.5", cop: 50, yc: 0, code: 355498 },
    { name: "Pickford", team: 8, pos: 1, price: 44, form: "3.8", pts: 98, goals: 0, assists: 0, xG: "0", xA: "0.1", xGC: "38.2", mins: 2700, bps: 380, bonus: 14, own: "8.2", cop: null, yc: 1, code: 116535 },
  ];

  const gwData = Array.from({ length: 31 }, (_, i) => ({
    id: i + 1,
    finished: true,
    is_current: i === 30,
    is_next: false,
    average_entry_score: Math.floor(45 + Math.random() * 25),
  }));

  const mockFixtures = [];
  let fId = 1;
  const fdrPresets = { 1: 4, 2: 3, 3: 2, 4: 2, 5: 3, 6: 4, 7: 2, 8: 2, 9: 2, 10: 1, 11: 1, 12: 5, 13: 5, 14: 3, 15: 4, 16: 3, 17: 1, 18: 3, 19: 2, 20: 2 };

  for (let gw = 31; gw <= 38; gw++) {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 20; i += 2) {
      const hStr = fdrPresets[shuffled[i + 1].id] || 3;
      const aStr = fdrPresets[shuffled[i].id] || 3;
      mockFixtures.push({
        id: fId++,
        event: gw,
        finished: false,
        team_h: shuffled[i].id,
        team_a: shuffled[i + 1].id,
        team_h_difficulty: Math.min(Math.max(hStr + Math.floor(Math.random() * 2 - 0.5), 1), 5),
        team_a_difficulty: Math.min(Math.max(aStr + Math.floor(Math.random() * 2 - 0.5), 1), 5),
      });
    }
  }

  const elements = mockPlayers.map((p, idx) => ({
    id: idx + 1,
    web_name: p.name,
    team: p.team,
    element_type: p.pos,
    now_cost: p.price,
    form: p.form,
    points_per_game: (p.pts / 30).toFixed(1),
    total_points: p.pts,
    minutes: p.mins,
    goals_scored: p.goals,
    assists: p.assists,
    expected_goals: p.xG,
    expected_assists: p.xA,
    expected_goal_involvements: String(parseFloat(p.xG) + parseFloat(p.xA)),
    expected_goals_conceded: p.xGC,
    clean_sheets: Math.floor(Math.random() * 12),
    bonus: p.bonus,
    bps: p.bps,
    chance_of_playing_next_round: p.cop,
    cost_change_event: Math.random() > 0.85 ? -1 : 0,
    cost_change_start: Math.floor(Math.random() * 20 - 5),
    selected_by_percent: p.own,
    yellow_cards: p.yc,
    red_cards: 0,
    code: p.code,
  }));

  return { bootstrap: { elements, teams, events: gwData }, fixtures: mockFixtures, isMock: true };
}
