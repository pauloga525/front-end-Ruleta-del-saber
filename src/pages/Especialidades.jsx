
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BotonImagen from "../components/BotonImagen";
import fondoEspecialidades from "/src/assets/fondos/fondoEspecialidades.png";
import regresarImg from "../assets/botones/regresar.png";
import "../index.css";

// Imports estáticos para carga instantánea
import preparatoriaImg from "../assets/botones/preparatoria.png";
import elementalImg from "../assets/botones/elemental.png";
import mediaImg from "../assets/botones/media.png";
import superiorImg from "../assets/botones/superior.png";
import bachilleratoImg from "../assets/botones/bachillerato.png";

const especialidades = [
  { key: 'preparatoria', label: 'Preparatoria', img: preparatoriaImg },
  { key: 'elemental', label: 'Básica Elemental', img: elementalImg },
  { key: 'media', label: 'Básica Media', img: mediaImg },
  { key: 'superior', label: 'Básica Superior', img: superiorImg },
  { key: 'bachillerato', label: 'Bachillerato', img: bachilleratoImg },
];

export default function Especialidades() {
  const navigate = useNavigate();
  const [transition, setTransition] = useState(false);

  const iniciarTransicion = useCallback((ruta) => {
    setTransition(true);
    setTimeout(() => navigate(ruta), 600);
  }, [navigate]);

  return (
    <div
      style={{
        backgroundImage: `url(${fondoEspecialidades})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "top repeat",
        boxSizing: "content-box",
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      
    >
        <button
         onClick={() => iniciarTransicion('/')}
         style={{
          backgroundImage: `url(${regresarImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: 'transparent',
          width: 180,
          height: 60,
          border: 'none',
          cursor: 'pointer',
          position: 'absolute',
          bottom: '30px',
          left: '30px',
          transition: 'transform 0.25s ease'
         }}
         onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
         onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
       ></button>
     

    
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "40px",
          width: "90%",
          maxWidth: "1400px",
          margin: "0 auto",
          justifyItems: "center",
          top: "250px",
          position: "relative",
        }}
      >
        {especialidades.map((e) => (
          <div key={e.key}>

            
            <div
              onClick={() => iniciarTransicion(`/cursos/${e.key}`)}
              style={{
                cursor: "pointer",
                transition: "transform 0.25s ease",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = "scale(1)";
              }}
            >
              <BotonImagen src={e.img} alt={e.label} />
            </div>

          </div>
        ))}
      </div>

      {/* Efecto de transición */}
      {transition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(5, 20, 45, 0.95)',
          zIndex: 9999,
          animation: 'fadeIn 0.5s ease-out forwards'
        }} />
      )}
    </div>
  );
}
