import { useState } from 'react';
import { useGameStore } from '../app/store';
import { LOUVRE_VISITOR_MAP, MUSEUM_FLOORS, MUSEUM_OVERVIEW, type MuseumFloor, type MuseumWing } from '../world/museumOverview';
import { RoomMap } from './RoomMap';
import { galleryById } from '../world/galleries';
import { floorMapViewBox } from '../world/mapRegistry';

export function MuseumMap() {
  const galleryId = useGameStore(state => state.player.galleryId);
  const currentGallery = galleryById(galleryId);
  const [selectedFloor, setSelectedFloor] = useState<MuseumFloor | null>(null);
  const floor = selectedFloor ?? currentGallery?.floor ?? 1;
  const [wing, setWing] = useState<MuseumWing | null>(null);
  const [roomOpen, setRoomOpen] = useState(!!currentGallery);
  const [showSecurity, setShowSecurity] = useState(true);
  const incident = useGameStore((state) => state.incident);
  const guardStatus = useGameStore((state) => state.guardStatus);
  const cameraStatus = useGameStore((state) => state.cameraStatus);
  const sensorStatus = useGameStore((state) => state.sensorStatus);
  const grandeCamera = useGameStore((state) => state.grandeCamera);
  const grandeSensor = useGameStore((state) => state.grandeSensor);
  const artifactStatus = useGameStore((state) => state.artifactStatus);
  const activeIncident = incident && incident.stage !== 'resolved';
  const areas = MUSEUM_OVERVIEW[floor];

  const selectFloor = (next: MuseumFloor) => {
    setSelectedFloor(next);
    setWing(null);
    setRoomOpen(false);
  };

  return (
    <div className="museum-map">
      <nav className="floor-tabs" aria-label="Museum floors">
        {MUSEUM_FLOORS.map((level) => (
          <button key={level} className={level === floor ? 'active' : ''} aria-pressed={level === floor} onClick={() => selectFloor(level)}>Level {level}</button>
        ))}
      </nav>
      {roomOpen ? (
        <div className="full-map-layout">
          <div className="large-map"><RoomMap floor={floor} viewBox={floorMapViewBox(floor)} showSecurity={showSecurity} /></div>
          <aside className="map-sidebar">
            <button className="secondary-button" onClick={() => setRoomOpen(false)}>Floor overview</button>
            <h3>Denon patrol route · Level {floor}</h3>
            <label><input type="checkbox" checked={showSecurity} onChange={(event) => setShowSecurity(event.target.checked)} /> Security markers</label>
            <ul className="security-map-key">
              <li className="key-player">You · {currentGallery ? `Room ${currentGallery.id}, ${currentGallery.name}` : 'Between galleries'}</li>
              <li className="key-artifact">Mona Lisa · {incident?.roomId === '711' ? artifactStatus.replaceAll('_', ' ') : 'safe'}</li>
              <li className="key-artifact">The Wedding Feast at Cana</li>
              <li className="key-artifact">La Belle Ferronnière</li>
              <li className="key-artifact">Saint John the Baptist · {incident?.roomId === '710' ? artifactStatus : 'safe'}</li>
              {showSecurity && <>
                <li className="key-guard">Guard G-12 · {guardStatus}</li>
                <li className="key-camera">Camera C-711 · {cameraStatus}</li>
                <li className="key-sensor">Sensor S-711-A · {sensorStatus}</li>
                <li className="key-camera">Camera C-710 · {grandeCamera}</li>
                <li className="key-sensor">Sensor S-710-A · {grandeSensor}</li>
              </>}
              <li className="key-door">Open passages and stairs</li>
              {activeIncident && <li className="key-incident">Incident · {incident.stage}</li>}
            </ul>
            <p>Security equipment and incidents are fictional.</p>
          </aside>
        </div>
      ) : (
        <>
          <nav className="floor-tabs wing-tabs" aria-label="Museum wings">
            <button className={wing === null ? 'active' : ''} aria-pressed={wing === null} onClick={() => setWing(null)}>All areas</button>
            {areas.map(({ wing: area }) => (
              <button key={area} className={wing === area ? 'active' : ''} aria-pressed={wing === area} onClick={() => setWing(area)}>{area}</button>
            ))}
          </nav>
          <div className={`museum-overview ${wing ? 'museum-overview-focused' : ''}`}>
            {areas.filter((area) => wing === null || wing === area.wing).map((area) => (
              <section key={area.wing} className={`museum-wing wing-${area.wing.toLowerCase().replace(' ', '-')}`}>
                <h3>{area.wing}</h3>
                <ul>{area.galleries.map((gallery) => <li key={gallery}>{gallery}</li>)}</ul>
                {floor === 1 && area.wing === 'Denon' && (
                  <button className="room-map-link" onClick={() => setRoomOpen(true)}>
                    <strong>711 · STATE ROOM</strong>
                    <span>710 · GRAND GALLERY · 708 · SQUARE ROOM · 703 · DARU STAIRS</span><span>{activeIncident ? 'Active incident · open live map' : 'Patrol area · open live map'}</span>
                  </button>
                )}
                {floor === 0 && area.wing === 'Denon' && (
                  <button className="room-map-link" onClick={() => setRoomOpen(true)}>
                    <strong>LOWER STAIR LANDING</strong><span>Open live map</span>
                  </button>
                )}
              </section>
            ))}
          </div>
          <p className="museum-map-note">Schematic visitor overview · Playable Denon route on Levels 1 and 0. <a href={LOUVRE_VISITOR_MAP} target="_blank" rel="noreferrer">Official Louvre floor plans</a></p>
        </>
      )}
    </div>
  );
}
