import { useGameStore } from './store';
import { GameScreen } from '../ui/GameScreen';
import { LoginScreen } from '../ui/LoginScreen';
import { StartScreen } from '../ui/StartScreen';

export default function App() {
  const screen = useGameStore((state) => state.screen);
  if (screen === 'login') return <LoginScreen />;
  if (screen === 'menu') return <StartScreen />;
  return <GameScreen />;
}
