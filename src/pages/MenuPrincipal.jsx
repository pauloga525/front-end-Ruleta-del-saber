
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import videoFondo from "../assets/videos/fondovideo.mp4";
import btnEspecialidades from "../assets/botones/botoniniciar.png";
import "../index.css";

export default function MenuPrincipal() {
  const navigate = useNavigate();
  const [transition, setTransition] = useState(null);
  const buttonRef = useRef(null);

  const startTransition = (type = "yellow") => {
    const rect = buttonRef.current.getBoundingClientRect();

    setTransition({
      type,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    setTimeout(() => navigate("/especialidades"), 1800);
  };

  return (
    <div style={styles.container}>

      
      <video
        src={videoFondo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={styles.video}
      />

      <div style={styles.centerBottom}>
        <button
          ref={buttonRef}
          style={{
            ...styles.btnImg,
            backgroundImage: `url(${btnEspecialidades})`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onClick={() => startTransition("circle")} 
        />
      </div>

      
      {transition && (
        <>
          <div style={{ ...styles.base, ...animations.circle, left: transition.x, top: transition.y }} />
          <div style={{ ...styles.base, ...animations.circle2, left: transition.x, top: transition.y }} />
          <div style={{ ...styles.base, ...animations.circle3, left: transition.x, top: transition.y }} />
          <div style={{ ...styles.base, ...animations.circle4, left: transition.x, top: transition.y }} />
          <div style={{ ...styles.base, ...animations.circle5, left: transition.x, top: transition.y }} />
        </>
      )}

    </div>
  );
}



const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#051535', // Fallback mientras carga el video
  },

  video: {
        position: "absolute", 
        top: 0,
        left: 0,              
        width: "100%",       
        height: "100%",      
        objectFit: "cover",  
        zIndex: 0,
    },

  centerBottom: {
    position: "absolute",
    bottom: "10px",
    left: "45.89%",
    transform: "translateX(-50%)",
    zIndex: 10,
  },

  btnImg: {
    width: 260,
    height: 110,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    border: "none",
    outline: "none",
    cursor: "pointer",
    transition: "0.25s",
    backgroundColor: "transparent",
  },

  base: {
  position: "fixed",
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  borderRadius: "50%",
  transform: "translate(-50%, -50%)",
  pointerEvents: "none",
  zIndex: 9999,
}

};

const animations = {
  circle: {
    backgroundColor: "rgba(5, 15, 35, 1)",
    animation: "circleExpand 1.8s ease-out forwards",
  },

  circle2: {
    backgroundColor: "rgba(10, 30, 60, 0.9)",
    animation: "circleExpand 1.8s ease-out 0.15s forwards",
  },

  circle3: {
    backgroundColor: "rgba(15, 45, 90, 0.8)",
    animation: "circleExpand 1.8s ease-out 0.3s forwards",
  },

  circle4: {
    backgroundColor: "rgba(20, 60, 120, 0.65)",
    animation: "circleExpand 1.8s ease-out 0.45s forwards",
  },

  circle5: {
    border: "3px solid rgba(0, 150, 255, 0.5)",
    backgroundColor: "transparent",
    animation: "circleExpand 1.8s ease-out 0.6s forwards",
  },

  fade: {
    backgroundColor: "rgba(1, 148, 216, 0.86)",
    animation: "fadeCircle 0.8s ease-out forwards",
  },

  spinner: {
    border: "8px solid rgba(255,255,255,0.3)",
    borderTop: "8px solid #00aaff",
    width: 60,
    height: 60,
    animation: "spinnerRotate 0.9s ease-out forwards",
  },
};



