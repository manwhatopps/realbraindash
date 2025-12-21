# BrainDash Royale - Complete UI Implementation

A comprehensive trivia game platform with real-money cash challenges, built with vanilla JavaScript and Supabase.

## Overview

BrainDash Royale is a feature-complete trivia game application that includes:
- Multiple game modes (Free Play, Online Matchmaking, Play With Friends, Cash Challenge)
- Real-time gameplay with synchronized timers
- Comprehensive wallet and payment system
- User profiles and statistics
- Global leaderboards
- Responsive design for all devices

## Access the Application

Open `braindash-royale.html` in your browser to start playing.

## Features

### 16 Complete Screens

1. **Landing/Home Screen** - Main entry point with game mode selection
2. **Authentication Screen** - Email/password, social login, and guest play
3. **Play Mode Selection** - Choose between different game modes
4. **Terms & Match Consent** - Required for cash challenges with risk disclosure
5. **Category Selection** - Choose trivia categories (General, Science, Sports, History, Music, Business)
6. **Lobby Browser** - View and join available lobbies
7. **Lobby Screen** - Pre-game waiting room with player status
8. **Pre-Game Countdown** - 3-2-1 countdown before match starts
9. **Question Screen** - Interactive quiz with visual timer and answer selection
10. **Between-Question Leaderboard** - Live standings after each question
11. **Final Results Screen** - Podium display with payouts
12. **Wallet Screen** - Balance display and transaction history
13. **Profile Screen** - User stats and match history
14. **Global Leaderboard** - Daily/Weekly/All-Time rankings
15. **Settings Screen** - Sound, notifications, and account management
16. **Error/Recovery States** - Network errors, match cancellations, etc.

### Game Flow

```
Landing → Auth (if needed) → Mode Selection → Category Selection →
Lobby Browser → Lobby → Countdown → Question Loop → Leaderboard → Results
```

### Key Features

- **Smooth Animations**: Fade-in transitions, pulse effects, and smooth state changes
- **Visual Timer**: SVG-based circular timer with countdown
- **Real-time Updates**: Live leaderboard updates between questions
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Error Handling**: Comprehensive error modals and loading states
- **State Management**: Global state with proper navigation flow

## Design System

### Colors

The application uses a professional blue-based color palette:
- Primary: Blue (#2563eb)
- Secondary: Green (#10b981)
- Accent: Orange (#f59e0b)
- Danger: Red (#ef4444)
- Neutral: Gray scale for backgrounds and text

### Typography

- Headings: Bold, large sizes with proper hierarchy
- Body text: 1.5 line height for readability
- Consistent spacing using 8px grid system

### Components

- **Buttons**: Primary, secondary, outline, and danger variants
- **Cards**: Elevated cards with hover effects
- **Forms**: Clean inputs with focus states
- **Modals**: Centered overlays with backdrop
- **Lists**: Structured lists for lobbies, players, and transactions

## Technical Implementation

### Architecture

```
braindash-royale.html    - Main HTML entry point
src/braindash-royale.css - Complete styling system
src/braindash-royale.js  - Application logic and routing
```

### State Management

Global state object manages:
- Current screen
- User authentication status
- Selected game mode and category
- Active lobby and match data
- Game progress (questions, scores, timers)
- User settings

### Navigation

Simple router function handles screen transitions:
```javascript
navigate(screen, data)
```

### Supabase Integration

- Authentication (email/password, social providers)
- Real-time game state synchronization
- Wallet and transaction management
- User profiles and statistics

## Game Mechanics

### Question Flow

1. Question displays with 4 answer options
2. 8-second countdown timer starts
3. Player selects answer or timer expires
4. Correct answer highlights in green, incorrect in red
5. 2-second leaderboard displays current standings
6. Next question loads automatically
7. After all questions, final results screen shows

### Scoring System

- Points awarded based on speed and accuracy
- Faster correct answers earn more points
- Real-time leaderboard updates
- Final placement determines cash payouts

### Cash Challenge Rules

- Entry fees clearly displayed with platform fees
- Risk disclosure required before entry
- Winner-take-all or tiered payout models
- Automatic wallet transactions
- Transaction history tracking

## Safety Features

### Responsible Gaming

- Clear risk warnings for cash challenges
- Entry fee and payout transparency
- Age verification (18+ only)
- Deposit and withdrawal limits
- Transaction history for accountability

### Error Handling

- Network disconnection recovery
- Match cancellation with refunds
- Loading states for all async operations
- User-friendly error messages
- Graceful fallbacks for failures

## Testing the Application

### Manual Testing Checklist

1. **Landing Screen**
   - Click all buttons to verify navigation
   - Check footer links

2. **Authentication**
   - Test email/password login
   - Try guest play mode
   - Verify error handling

3. **Game Flow**
   - Select each game mode
   - Accept terms for cash challenge
   - Choose different categories
   - Join and create lobbies

4. **Gameplay**
   - Verify countdown animation
   - Test answer selection
   - Check timer functionality
   - View leaderboard transitions
   - Complete full game to results

5. **Profile & Wallet**
   - View profile stats
   - Check wallet balance
   - Review transaction history

6. **Settings**
   - Toggle sound and notifications
   - Test logout functionality

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

- Fast initial load with vanilla JavaScript
- Smooth 60fps animations
- Efficient state management
- Lazy loading for heavy features
- Optimized CSS with CSS variables

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Color contrast ratios meet WCAG standards
- Screen reader friendly
- Focus states on interactive elements

## Future Enhancements

Potential features to add:
- Voice chat in lobbies
- Spectator mode
- Tournament brackets
- Achievement system
- Social sharing
- Mobile app (React Native)
- Progressive Web App (PWA)
- Offline mode with cached questions

## Development Notes

### Adding New Screens

1. Create render function: `renderNewScreen()`
2. Add case to router in `render()` function
3. Add navigation actions in `handleAction()`
4. Create CSS classes in `braindash-royale.css`
5. Test all entry/exit points

### Integrating with Backend

Replace mock data with Supabase queries:
```javascript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);
```

### Adding Categories

Update the `CATEGORIES` array in the JavaScript file:
```javascript
const CATEGORIES = [
  { id: 'new-cat', name: 'Category Name', icon: '🎯', difficulty: 'Medium' }
];
```

## Security Considerations

- All authentication handled by Supabase
- No sensitive data in client-side code
- RLS policies enforce data access rules
- Payment processing through secure providers
- HTTPS required for production

## Deployment

1. Build the project: `npm run build`
2. Deploy `dist/` folder to hosting service
3. Configure environment variables
4. Set up custom domain
5. Enable HTTPS

## Support

For issues or questions:
- Check browser console for errors
- Verify Supabase connection
- Review network requests
- Check state object in debugger

## License

This is a demonstration project. All rights reserved.

## Credits

Built with:
- Vanilla JavaScript (ES6+)
- Supabase for backend
- Vite for build tooling
- Modern CSS (Grid, Flexbox, Variables)
