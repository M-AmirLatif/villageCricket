/**
 * Note: To run this seed script against your Firebase project, 
 * you either need to use the Firebase Admin SDK (which requires a service account key),
 * OR temporarily adjust your Firestore rules to `allow write: if true;` while you run 
 * a client-side seeding script from a browser console.
 * 
 * Since this is a BaaS setup, the easiest way to seed data without setting up 
 * an entire Node Admin SDK environment is to simply use the Admin UI you just built!
 * 
 * To replicate the "seeded" requirement, here is the JSON structure you can enter via 
 * the Admin Dashboard, or use this array in a temporary React `useEffect` to batch insert.
 */

export const seedData = {
  tournament: {
    name: "Asia Cup",
    season: "2025",
    category: "International",
    status: "ongoing",
    bannerUrl: ""
  },
  teams: [
    { teamName: "Pakistan", matchesPlayed: 2, wins: 2, losses: 0, draws: 0, points: 4, netRunRate: 1.500 },
    { teamName: "India", matchesPlayed: 2, wins: 1, losses: 0, draws: 1, points: 3, netRunRate: 1.050 },
    { teamName: "Bangladesh", matchesPlayed: 2, wins: 1, losses: 1, draws: 0, points: 2, netRunRate: 0.200 },
    { teamName: "Sri Lanka", matchesPlayed: 2, wins: 1, losses: 1, draws: 0, points: 2, netRunRate: -0.100 },
    { teamName: "Afghanistan", matchesPlayed: 2, wins: 0, losses: 1, draws: 1, points: 1, netRunRate: -0.800 },
    { teamName: "Nepal", matchesPlayed: 2, wins: 0, losses: 2, draws: 0, points: 0, netRunRate: -1.900 }
  ]
};

console.log("Use the Admin UI to input these, or create an admin script if needed!");
