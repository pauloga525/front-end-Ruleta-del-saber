// /src/pages/Cursos.jsx

import React, { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CursoBoton from "../components/CursoBoton";
import "../index.css";

// Fondo
import fondoCursos from "../assets/fondos/fondoCursos.png";
import regresarImg from "../assets/botones/regresar.png";

// Imágenes de cursos
import primeroImg from "../assets/botones/primero.png";
import segundoImg from "../assets/botones/segundo.png";
import terceroImg from "../assets/botones/tercero.png";
import cuartoImg from "../assets/botones/cuarto.png";
import quintoImg from "../assets/botones/quinto.png";
import sextoImg from "../assets/botones/sexto.png";
import septimoImg from "../assets/botones/septimo.png";
import octavoImg from "../assets/botones/octavo.png"; 
import novenoImg from "../assets/botones/noveno.png";
import decimoImg from "../assets/botones/decimo.png";
import primeroBImg from "../assets/botones/bachillerato1.png";
import segundoBImg from "../assets/botones/bachillerato2.png";
import terceroBImg from "../assets/botones/bachillerato3.png";

// Constantes fuera del componente para evitar re-creación
const imagenesCursos = {
  "1ro": primeroImg,
  "2do": segundoImg,
  "3ro": terceroImg,
  "4to": cuartoImg,
  "5to": quintoImg,
  "6to": sextoImg,
  "7mo": septimoImg,
  "8vo": octavoImg,
  "9no": novenoImg,
  "10mo": decimoImg,
  "1rob": primeroBImg,
  "2dob": segundoBImg,
  "3rob": terceroBImg,
};

const cursosPorEspecialidad = {
  preparatoria: ["1ro"],
  elemental: ["2do", "3ro", "4to"],
  media: ["5to", "6to", "7mo"],
  superior: ["8vo", "9no", "10mo"],
  bachillerato: ["1rob", "2dob", "3rob"],
};

const cursosAvanzados = ["1rob", "2dob", "3rob"];
const cursosBasicaElementalMedia = ["2do", "3ro", "4to", "5to", "6to", "7mo"];

export default function Cursos() {
  const { especialidad } = useParams();
  const navigate = useNavigate();
  const [transition, setTransition] = useState(false);

  const iniciarTransicion = useCallback((ruta) => {
    setTransition(true);
    setTimeout(() => navigate(ruta), 600);
  }, [navigate]);

  const cursos = useMemo(() => cursosPorEspecialidad[especialidad] || [], [especialidad]);

  const navegarARuleta = useCallback((curso) => {
    if (especialidad === "preparatoria" && curso === "1ro") {
      iniciarTransicion(`/ruleta/primero`);
    } else if (cursosBasicaElementalMedia.includes(curso)) {
      iniciarTransicion(`/ruleta/basica/${especialidad}/${curso}`);
    } else if (cursosAvanzados.includes(curso)) {
      iniciarTransicion(`/ruleta-avanzada/${especialidad}/${curso}`);
    } else {
      iniciarTransicion(`/ruleta-basica/${especialidad}/${curso}`);
    }
  }, [especialidad, iniciarTransicion]);

  return (
    
    <div
      style={{
        backgroundImage: `url(${fondoCursos})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      
      {/* Botón de Regresar */}
      <button
        onClick={() => iniciarTransicion(`/especialidades`)}
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


      {/* GRID DE BOTONES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "30px",
          width: "80%",
          maxWidth: "600px",
          marginTop: "200px",
        }}
      >
        {cursos.map((c) => (
          <CursoBoton 
            key={c}
            imagenSrc={imagenesCursos[c]}
            onClick={() => navegarARuleta(c)} 
          />
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