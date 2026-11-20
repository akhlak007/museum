import { useState, useEffect } from 'react';
import { useGameStore } from '../app/store';

const CAMERAS = [
  {
    id: 'CAM-711',
    room: '711',
    name: 'Salle des États · Mona Lisa',
    zone: 'Denon Level 1 · West Bay',
    status: 'ALARM ACTIVE',
    timestamp: '02:12:44 AM',
    note: 'Sensor S-711-A tripped. Signal broadcast anomaly detected at baseboard.',
    description: 'Surveillance monitors the Mona Lisa presentation wall. The protective stanchion perimeter alarm is flashing, but the artwork is physically undisturbed.',
    clue: 'DECOY CONFIRMED: Tampered sensor wire transmitting false breach pulses.',
  },
  {
    id: 'CAM-710',
    room: '710',
    name: 'Grande Galerie · Leonardo Bay',
    zone: 'Denon Level 1 · Center Bay',
    status: 'EMPTY WALL DETECTED',
    timestamp: '02:14:18 AM',
    note: 'Wall alcove empty. Frame bracket severed.',
    description: 'Archived playback from 02:14 AM captures an intruder in dark security attire lifting Leonardo da Vinci’s "La Belle Ferronnière" from its mounting.',
    clue: 'THEFT CONFIRMED: Target is La Belle Ferronnière. Suspect fled eastward.',
  },
  {
    id: 'CAM-708',
    room: '708',
    name: 'Salon Carré · East Corridor',
    zone: 'Denon Level 1 · Square Room',
    status: 'OPTICAL DISTORTION',
    timestamp: '02:15:02 AM',
    note: 'Lens surface coated with anti-IR solvent.',
    description: 'Heavy smearing obscuring the central field of view. Thermal tracking indicates rapid passage toward the Daru Staircase entrance.',
    clue: 'ROUTE CONFIRMED: Suspect bypassed Salon Carré heading for Daru flight.',
  },
  {
    id: 'CAM-703',
    room: '703',
    name: 'Daru Staircase · Upper Flight',
    zone: 'Denon Level 1 -> Level 0',
    status: 'MOTION LOGGED',
    timestamp: '02:16:30 AM',
    note: 'Descent motion detected toward lower landing.',
    description: 'Camera pointed down the grand marble stairway past the Winged Victory. A figure carrying a padded rectangular folio was recorded running down to Level 0.',
    clue: 'INTERCEPTION TARGET: Suspect cornered near Roman Candelabrum on Level 0.',
  },
];

export function CCTVPanel() {
  const setPanel = useGameStore((state) => state.setPanel);
  const reviewCCTV = useGameStore((state) => state.reviewCCTV);
  const heistState = useGameStore((state) => state.heistState);
  const [selectedCam, setSelectedCam] = useState(CAMERAS[0]);
  const [playbackTime, setPlaybackTime] = useState<'live' | 'event'>('live');

  useEffect(() => {
    reviewCCTV(selectedCam.room);
  }, [selectedCam.room, reviewCCTV]);

  const reviewedCount = heistState?.cctvReviewedRooms.length ?? 0;

  return (
    <div className="panel-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}>
      <section className="panel panel-wide cctv-modal">
        <header>
          <div>
            <p className="eyebrow">Denon Central Security · Closed-Circuit Matrix</p>
            <h2>CCTV Surveillance Console</h2>
          </div>
          <button className="icon-button" onClick={() => setPanel(null)} aria-label="Close CCTV">×</button>
        </header>

        <div className="cctv-body">
          <div className="cctv-nav">
            <span className="cctv-nav-title">Denon Feeds ({reviewedCount}/4 Reviewed)</span>
            {CAMERAS.map((cam) => {
              const isReviewed = heistState?.cctvReviewedRooms.includes(cam.room);
              const isSelected = selectedCam.id === cam.id;
              return (
                <button
                  key={cam.id}
                  className={`cctv-tab ${isSelected ? 'active' : ''} ${isReviewed ? 'reviewed' : ''}`}
                  onClick={() => {
                    setSelectedCam(cam);
                    setPlaybackTime('live');
                  }}
                >
                  <div className="cctv-tab-head">
                    <strong>{cam.id}</strong>
                    <span className={`cctv-status-badge ${cam.status.includes('ALARM') ? 'alarm' : ''}`}>
                      {cam.status}
                    </span>
                  </div>
                  <span className="cctv-tab-sub">{cam.name}</span>
                </button>
              );
            })}
          </div>

          <div className="cctv-viewport-column">
            <div className="cctv-screen">
              <div className="cctv-scanlines" />
              <div className="cctv-hud-header">
                <div>
                  <span className="recording-dot" />
                  <b>{selectedCam.id} · {selectedCam.zone}</b>
                </div>
                <div>
                  <span>SYS CLOCK: {playbackTime === 'live' ? '02:18:42 AM' : selectedCam.timestamp}</span>
                </div>
              </div>

              <div className="cctv-view-visual">
                <div className="cctv-feed-placeholder">
                  <div className="cctv-noise" />
                  <div className="cctv-vector-frame">
                    <div className="cctv-reticle-cross" />
                    <p className="cctv-cam-title">{selectedCam.name}</p>
                    {playbackTime === 'event' ? (
                      <div className="cctv-event-playback">
                        <span className="event-badge">RECORDED INCIDENT EVENT</span>
                        <p>{selectedCam.description}</p>
                      </div>
                    ) : (
                      <div className="cctv-live-feed">
                        <span className="live-badge">LIVE SURVEILLANCE FEED</span>
                        <p>{selectedCam.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="cctv-hud-footer">
                <div className="cctv-scrubber">
                  <button
                    className={`scrub-btn ${playbackTime === 'event' ? 'active' : ''}`}
                    onClick={() => setPlaybackTime('event')}
                  >
                    ⏪ Incident Event ({selectedCam.timestamp})
                  </button>
                  <button
                    className={`scrub-btn ${playbackTime === 'live' ? 'active' : ''}`}
                    onClick={() => setPlaybackTime('live')}
                  >
                    ⏺ LIVE (02:18 AM)
                  </button>
                </div>
              </div>
            </div>

            <div className="cctv-intel-card">
              <div className="intel-header">
                <span className="eyebrow">Forensic Surveillance Analysis</span>
                <span className="clue-tag">INTELLIGENCE</span>
              </div>
              <p className="clue-text">{selectedCam.clue}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
