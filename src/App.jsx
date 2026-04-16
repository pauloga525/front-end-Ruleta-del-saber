// /src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

// Importación lazy de páginas para code splitting
const MenuPrincipal = lazy(() => import("./pages/MenuPrincipal"));
const Especialidades = lazy(() => import("./pages/Especialidades"));
const Cursos = lazy(() => import("./pages/Cursos"));
const RuletaPage = lazy(() => import("./pages/RuletaPage"));
const RuletaComponent2 = lazy(() => import("./components/RuletaComponent2"));
const RuletaComponent = lazy(() => import("./components/RuletaComponent"));
const RuletaPrimero = lazy(() => import("./components/RuletaPrimero"));
const RuletaBasica = lazy(() => import("./components/RuletaBasica"));
const PreguntaPage = lazy(() => import("./pages/PreguntaPage"));

// Componente de carga mejorado sin destello
const Loading = () => (
  <div style={{
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#051535',
    color: '#fff',
    fontSize: '1.2rem',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999
  }}>
    <div style={{
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease-in'
    }}>
      Cargando...
    </div>
  </div>
);

// Wrapper para aplicar transición sin interferir con fondos personalizados
const PageWrapper = ({ children, transparent = false }) => (
  <div className="page-transition" style={{ 
    width: '100vw', 
    height: '100vh',
    backgroundColor: transparent ? 'transparent' : '#051535',
    overflow: 'hidden',
    position: 'relative'
  }}>
    {children}
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Menú principal con video de fondo - sin fondo para que se vea el video */}
        <Route path="/" element={<PageWrapper transparent><MenuPrincipal /></PageWrapper>} />

        {/* Navegación general */}
        <Route path="/especialidades" element={<PageWrapper><Especialidades /></PageWrapper>} />
        <Route path="/cursos/:especialidad" element={<PageWrapper><Cursos /></PageWrapper>} />
        <Route path="/ruleta/:especialidad/:curso" element={<PageWrapper><RuletaPage /></PageWrapper>} />
      
        <Route path="/ruleta-basica/:especialidad/:curso" element={<PageWrapper><RuletaComponent2 /></PageWrapper>} />
        <Route path="/ruleta-avanzada/:especialidad/:curso" element={<PageWrapper><RuletaComponent /></PageWrapper>} />
        <Route path="/ruleta/primero" element={<PageWrapper><RuletaPrimero /></PageWrapper>} />
        <Route path="/ruleta/basica/:especialidad/:curso" element={<PageWrapper><RuletaBasica /></PageWrapper>} />
        
        {/* Página de preguntas: recibe el parámetro 'materia' */}
        <Route path="/preguntas/:materia" element={<PageWrapper><PreguntaPage /></PageWrapper>} />
      </Routes>
    </Suspense>
  );
}
