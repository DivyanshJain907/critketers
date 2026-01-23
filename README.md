# 🏏 Cricket Umpire Scoring and Match Recording System

A professional cricket match data recording web application designed for umpires to quickly and accurately log live match events. Built with **Next.js + PostgreSQL + Prisma**.

## 🎯 Features

### ✅ Core Functionality

- **Team & Player Management**: Create teams and add players with roles (Batsman, Bowler, All-rounder, Wicket-keeper)
- **Match Setup**: Create matches with team selection, toss details, and overs limit
- **Live Scoring**: Record runs (0,1,2,3,4,6), extras, and ball-by-ball events
- **Wicket Recording**: Track wicket types (Bowled, Caught, Run Out, LBW, Stumped, Hit Wicket)
- **Player Statistics**: Auto-calculated batting/bowling stats and fielding records
- **Match History**: Ball-by-ball history with searchable records
- **Mobile-First UI**: Umpire-friendly, tap-friendly interface optimized for field use

## 🛠 Tech Stack

- **Frontend**: Next.js 16+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Role-based access (Umpire, Viewer, Admin)
- **Validation**: Client-side and server-side input validation

## 📋 Database Schema

### Key Models

- **User**: Umpires, viewers, admins with role-based access
- **Team**: Cricket teams with players
- **Player**: Team members with roles and statistics
- **Match**: Match details, teams, toss, and innings
- **Innings**: Individual innings with runs, wickets, overs
- **Over**: Overs with ball count and runs
- **Ball**: Individual deliveries with runs and type
- **Wicket**: Dismissal records with type and bowler details
- **Extra**: Wides, no-balls, byes, leg-byes
- **BattingStats**: Individual batting performance
- **BowlingStats**: Individual bowling performance
- **FieldingStats**: Catches, run-outs, stumpings

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+ database
- Git

### Installation

1. **Clone and Setup**
```bash
cd critketers
npm install
```

2. **Configure Database**
Create `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/critketers"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Setup Database**
```bash
npm run db:push
```

4. **Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📱 User Interface

### Home Dashboard
- Quick navigation to all features
- Team management
- Match creation and management
- Live scoring interface
- Statistics and reports

### Team Management
- Create teams with short codes
- Add/manage players
- Assign player roles
- View squad details

### Match Setup
- Select teams and overs limit
- Record toss details
- Select opening XI
- Configure innings

### Live Scoring Interface
- Large tap-friendly buttons for umpires
- Real-time score updates
- Ball-by-ball recording
- Quick wicket entry
- Extra runs management

## 🔒 Security & Validation

✅ Role-based access control (RBAC)
✅ Input validation for all cricket rules (e.g., max 6 balls per over)
✅ Transaction support for data integrity
✅ Prevent duplicate ball submissions
✅ Lock completed overs
✅ Timestamp every event
✅ Audit logging for match changes

## 🧪 API Endpoints

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `GET /api/teams/[id]` - Get team details
- `GET /api/teams/[id]/players` - List team players
- `POST /api/teams/[id]/players` - Add player

### Matches
- `GET /api/matches` - List all matches
- `POST /api/matches` - Create match
- `GET /api/matches/[id]` - Get match details
- `PATCH /api/matches/[id]` - Update match status

### Innings
- `POST /api/matches/[id]/innings` - Start innings
- `GET /api/matches/[id]/innings` - List innings

### Balls & Scoring
- `POST /api/matches/[id]/innings/[inningsId]/balls` - Record ball
- `GET /api/matches/[id]/innings/[inningsId]/balls` - Get balls history
- `POST /api/matches/[id]/innings/[inningsId]/wickets` - Record wicket
- `POST /api/matches/[id]/innings/[inningsId]/extras` - Record extras

## 📊 Statistics Feature

### Player Statistics
- Runs, balls faced, strike rate
- Fours and sixes
- Bowling figures (overs, runs, wickets)
- Catches, run-outs, stumpings

### Match Statistics
- Runs per over
- Current run rate
- Projected scores
- Fall of wickets
- Bowler economy rates

## 🎨 UI/UX Highlights

✨ **Umpire-First Design**: Minimal UI, quick data entry
✨ **Mobile Optimized**: Fully responsive for field use
✨ **Dark Mode Support**: Reduced eye strain in bright conditions
✨ **Large Buttons**: Easy to tap with gloves/hands
✨ **Real-time Updates**: Instant score synchronization
✨ **Keyboard Shortcuts**: Quick number entry for runs

## 📝 Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Home dashboard
│   ├── teams/
│   │   ├── page.tsx            # Teams list
│   │   └── [id]/               # Team details
│   ├── matches/
│   │   ├── page.tsx            # Matches list
│   │   └── [id]/               # Match details & scoring
│   └── api/
│       ├── teams/              # Team endpoints
│       └── matches/            # Match endpoints
├── lib/
│   └── prisma.ts              # Prisma client
└── components/                 # Reusable components

prisma/
├── schema.prisma              # Database schema
└── seed.js                    # Sample data
```

## 🔄 Cricket Rules Implementation

✅ 6 balls per over (standard T20/ODI)
✅ Maximum 6 runs per legal ball
✅ Extras: Wide, No-ball, Bye, Leg-bye
✅ Wicket types: Bowled, Caught, Run Out, LBW, Stumped, Hit Wicket
✅ Auto-calculation of all statistics
✅ Over completion validation
✅ Innings completion logic

## 🚀 Deployment

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Connect to Vercel
vercel --prod
```

### Environment Variables (Production)
```env
DATABASE_URL=<your-prod-database-url>
NEXTAUTH_SECRET=<generate-secure-secret>
NEXTAUTH_URL=<your-production-url>
```

## 📚 Cricket Scoring Guide

### Recording a Ball
1. Select striker and non-striker
2. Select bowler
3. Enter runs
4. Select ball type (Legal, Wide, No-ball, etc.)

### Recording a Wicket
1. Select batsman dismissed
2. Select bowler who took wicket
3. Select wicket type
4. Auto-selects next batsman

### Extras
- Wide: 1 run + re-bowled
- No-ball: 1 run + re-bowled
- Bye: 1+ runs, no batsman contact
- Leg-bye: 1+ runs off batsman's body

## 🐛 Common Issues & Solutions

### Database Connection
```bash
# Test connection
npx prisma db execute --stdin < test.sql
```

### Schema Sync Issues
```bash
# Reset and re-push schema
npm run db:push -- --force-reset
```

### API Not Found
- Ensure route files are in `src/app/api/` folder
- Check file naming: `route.ts` (not `api.ts`)

## 📖 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Cricket Rules (ICC)](https://www.icc-cricket.com/)

## 📄 License

This project is open source and available under the MIT License.

## 👤 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built for real-world cricket scoring** - Replace paper scoring with professional digital recording.This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
