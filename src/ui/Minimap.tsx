import { useGameStore } from '../app/store';
import { RoomMap } from './RoomMap';
import { floorMapViewBox } from '../world/mapRegistry';

export function Minimap() {
  const player = useGameStore((state) => state.player);
  const setPanel = useGameStore((state) => state.setPanel);

  return (
    <aside className="minimap" aria-label={`Live Room ${player.galleryId} minimap`}>
      <div className="minimap-heading"><span>{player.galleryId === 'daru-lower' ? 'LOWER LANDING' : `ROOM ${player.galleryId}`}</span><strong>LEVEL {player.floor}</strong></div>
      <RoomMap floor={player.floor} viewBox={floorMapViewBox(player.floor)} />
      <button className="minimap-open" onClick={() => setPanel('map')} aria-label="Open full museum map"><kbd>M</kbd> Museum map</button>
    </aside>
  );
}
