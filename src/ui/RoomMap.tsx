import { useGameStore } from '../app/store';
import { galleryMapBounds, mapHeading, projectToMap, ROOM_711_MARKERS as markers } from '../world/mapRegistry';
import { ferronnierePosition, galleries, galleryLocations, inspectionPoints, passages } from '../world/galleries';

export function RoomMap({ floor, viewBox, showSecurity = true }: { floor: number; viewBox: string; showSecurity?: boolean }) {
  const player = useGameStore((state) => state.player);
  const incident = useGameStore((state) => state.incident);
  const field = useGameStore(state => state.fieldContact);
  const guard = useGameStore((state) => state.guardMapPosition);
  const guardStatus = useGameStore((state) => state.guardStatus);
  const cameraStatus = useGameStore((state) => state.cameraStatus);
  const sensorStatus = useGameStore((state) => state.sensorStatus);
  const artifactStatus = useGameStore((state) => state.artifactStatus);

  const grandeCamera = useGameStore(state => state.grandeCamera);
  const grandeSensor = useGameStore(state => state.grandeSensor);
  const monaStatus = incident?.roomId === '711' ? artifactStatus : 'safe';
  const johnStatus = incident?.roomId === '710' ? artifactStatus : 'safe';
  const grande = galleryLocations['710'];
  const location = field?.position ?? (incident?.roomId === '710' ? projectToMap(...grande.incident) : markers.incident);
  const camera = projectToMap(...grande.camera);
  const sensor = projectToMap(...grande.sensor);
  const art = projectToMap(...grande.artwork);
  const wedding = projectToMap(...galleryLocations['711'].wedding);
  const ferronniere = projectToMap(...ferronnierePosition);
  const rooms = galleries.filter(gallery => gallery.floor === floor);
  const canSeePlayer = player.floor === floor;
  return (
    <svg viewBox={viewBox} role="img" aria-label={`Live security map, level ${floor}${canSeePlayer && player.galleryId ? `, current room ${player.galleryId}` : ''}`}>
      {rooms.map(room => {
        const bounds = galleryMapBounds(room.bounds);
        return <g key={room.id}>
          <rect className={`map-room${canSeePlayer && player.galleryId === room.id ? ' map-room-current' : ''}`} {...bounds}>
            <title>{room.id} · {room.name}</title>
          </rect>
          <text className="map-room-label" x={bounds.x + 4} y={bounds.y + 7}>{room.id === 'daru-lower' ? 'LANDING' : room.id}</text>
        </g>;
      })}
      {passages.filter(door => rooms.some(room => door.rooms.some(id => id === room.id))).map(door => {
        const { x, y } = projectToMap(door.x, door.z);
        return <g key={door.rooms.join('-')} className="map-passage" transform={`translate(${x} ${y})`}>
          <title>Open passage · {door.rooms.join(' ↔ ')}</title>
          <path d={door.axis === 'x' ? 'M0 -4V4' : 'M-4 0H4'} />
        </g>;
      })}
      {inspectionPoints.filter(point => point.room === '708' || point.room === '703' || point.room === 'daru-lower')
        .filter(point => rooms.some(room => room.id === point.room)).map(point => {
          const { x, y } = projectToMap(point.x, point.z);
          return <circle key={point.title} className="map-artifact" cx={x} cy={y} r="2">
            <title>{point.title}</title>
          </circle>;
        })}
      {floor === 1 && <>
      <circle className={`map-artifact ${johnStatus === 'safe' ? '' : 'map-alert'}`} cx={art.x} cy={art.y} r="2"><title>Saint John the Baptist · {johnStatus}</title></circle>
      <circle className="map-artifact" cx={wedding.x} cy={wedding.y} r="2"><title>The Wedding Feast at Cana</title></circle>
      <circle className="map-artifact" cx={ferronniere.x} cy={ferronniere.y} r="2"><title>La Belle Ferronnière</title></circle>
      <path className="map-barrier" d="M36 24H64" />
      <rect className={`map-artifact ${monaStatus === 'safe' ? '' : 'map-alert'}`} x={markers.artifact.x - 3} y={markers.artifact.y - 2} width="6" height="4" rx="1">
        <title>Mona Lisa · {monaStatus.replaceAll('_', ' ')}</title>
      </rect>
      {showSecurity && <>
        <rect className={`map-camera map-resource-${grandeCamera}`} x={camera.x} y={camera.y} width="4" height="3"><title>C-710 · {grandeCamera}</title></rect>
        <circle className={`map-sensor map-resource-${grandeSensor}`} cx={sensor.x} cy={sensor.y} r="2"><title>S-710-A · {grandeSensor}</title></circle>
        <circle className="map-guard" data-room={guard.galleryId} cx={guard.x} cy={guard.y} r="2.4"><title>Guard G-12 · {guardStatus}</title></circle>
        <rect className={`map-camera map-resource-${cameraStatus}`} x={markers.camera.x - 2.5} y={markers.camera.y - 1.5} width="5" height="3" rx="1">
          <title>Camera C-711 · {cameraStatus}</title>
        </rect>
        <path className={`map-sensor map-resource-${sensorStatus}`} d="M0 -2.8 L2.8 0 L0 2.8 L-2.8 0Z" transform={`translate(${markers.sensor.x} ${markers.sensor.y})`}>
          <title>Sensor S-711-A · {sensorStatus}</title>
        </path>
      </>}
      {incident && incident.stage !== 'resolved' && (
        <g className="map-incident">
          <title>{incident.title} · {incident.stage}</title>
          <circle cx={location.x} cy={location.y} r="4.5" />
          <text x={location.x} y={location.y + 2.4}>!</text>
        </g>
      )}
      </>}
      {canSeePlayer && <g className="map-player" data-room={player.galleryId} transform={`translate(${player.x} ${player.y}) rotate(${mapHeading(player.yaw)})`}>
        <title>Your position and facing direction</title>
        <path d="M0 -5 L3.5 4 L0 2 L-3.5 4 Z" />
      </g>}
    </svg>
  );
}
