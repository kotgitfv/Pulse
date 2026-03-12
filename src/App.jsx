import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Play, Pause, Plus, Music, ChevronDown } from 'lucide-react';
import './assets/css/main.css';

function App() {
  const [user, setUser] = useState(localStorage.getItem('userName') || '');
  const [tempName, setTempName] = useState('');
  const [tracks, setTracks] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Для прогресс-бара
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef(new Audio());
  const fileInputRef = useRef(null);

  const categories = ['All', 'My Music', ...new Set(tracks.map(t => t.added_by).filter(name => name !== user))];

  const fetchTracks = async () => {
    const { data } = await supabase.from('tracks').select('*').order('id', { ascending: false });
    setTracks(data || []);
  };

  useEffect(() => {
    if (user) fetchTracks();
  }, [user]);

  // Слушатели времени аудио
  useEffect(() => {
    const audio = audioRef.current;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    
    // Автоматическое переключение (опционально) или просто стоп
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      localStorage.setItem('userName', tempName);
      setUser(tempName);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);

    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('songs').upload(fileName, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('songs').getPublicUrl(fileName);
      await supabase.from('tracks').insert([{
        name: file.name.replace(/\.[^/.]+$/, ""),
        url: publicUrl,
        added_by: user
      }]);
      fetchTracks();
    }
    setIsUploading(false);
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!user) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Welcome 🎵</h1>
          <form onSubmit={handleLogin}>
            <input 
              type="text" className="auth-input" placeholder="Enter your name"
              value={tempName} onChange={(e) => setTempName(e.target.value)}
            />
            <button type="submit" className="auth-submit">Continue</button>
          </form>
        </div>
      </div>
    );
  }

  const filteredTracks = tracks.filter(track => {
    if (activeTab === 'All') return true;
    if (activeTab === 'My Music') return track.added_by === user;
    return track.added_by === activeTab;
  });

  return (
    <div className="mobile-wrapper">
      <header className="header">
        <h1>{activeTab}</h1>
        <button className="add-btn" onClick={() => !isUploading && fileInputRef.current.click()}>
          {isUploading ? <div className="spinner"></div> : <Plus size={24} />}
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden />
      </header>

      <div className="filter-tabs">
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`tab ${activeTab === cat ? 'active' : ''}`}
            onClick={() => setActiveTab(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <main className="track-list">
        {filteredTracks.map(track => (
          <div key={track.id} className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
               onClick={() => {
                 if (currentTrack?.id !== track.id) {
                   audioRef.current.src = track.url;
                   audioRef.current.play();
                   setCurrentTrack(track);
                   setIsPlaying(true);
                 }
               }}>
            <div className="track-info">
              <span className="name">{track.name}</span>
              <span className="author">{track.added_by === user ? 'You' : track.added_by}</span>
            </div>
          </div>
        ))}
      </main>

      {currentTrack && (
        <footer className={`mini-player ${isPlaying ? 'playing' : ''}`} onClick={() => setIsPlayerOpen(true)}>
          <div className="player-info">
            <span className="playing-name">{currentTrack.name}</span>
            <span className="playing-status">{isPlaying ? "Now Playing" : "Paused"}</span>
          </div>
          <button className="play-btn" onClick={(e) => {
            e.stopPropagation();
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
          }}>
            {isPlaying ? <Pause fill="white" size={24} /> : <Play fill="white" size={24} />}
          </button>
        </footer>
      )}

      {/* FULL PLAYER MODAL */}
      <div className={`full-player ${isPlayerOpen ? 'open' : ''}`}>
        <div className="close-handle" onClick={() => setIsPlayerOpen(false)}></div>
        
        <div className="big-art">
          <Music size={120} color="#333" />
        </div>

        <div className="full-info">
          <h2>{currentTrack?.name}</h2>
          <p>Added by {currentTrack?.added_by}</p>
        </div>

        <div className="seeker-container">
          <input 
            type="range" 
            min="0" 
            max={duration || 0} 
            value={currentTime} 
            onChange={handleSeek}
            className="seeker"
          />
          <div className="time-info">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button className="big-play-btn" onClick={() => {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }}>
           {isPlaying ? <Pause size={34} color='' fill="white"/> : <Play size={34} fill="white"/>}
        </button>
      </div>
    </div>
  );
}

export default App;