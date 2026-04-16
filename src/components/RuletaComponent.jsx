// ...existing code...
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ruletaImg from "../assets/ruleta/ruleta.png"; 
import flechaImg from "../assets/ruleta/flecha.png"; 
import fondoImg from "../assets/fondos/fondoruleta.png";
import botonGirarImg from "../assets/botones/girar.png";


const SECTORES_RUEDA = [
    { id: 1, nombre: "Sector 1: Historia", ruta: "historia" }, 
    { id: 2, nombre: "Sector 2: Fisica", ruta: "fisica" },  
    { id: 3, nombre: "Sector 3: Lengua y literatura", ruta: "lengua-y-literatura" },  
    { id: 4, nombre: "Sector 4: Razonamiento Abstracto", ruta: "razonamiento-abstracto" },  
    { id: 5, nombre: "Sector 5: Matematicas", ruta: "matematicas" },  
    { id: 6, nombre: "Sector 6: Enseñanzas Religiosas", ruta: "ensenanzas-religiosas" },  
    { id: 7, nombre: "Sector 7: Ingles", ruta: "ingles" },      
];

export default function RuletaComponent({ onFinish }) {
    const { especialidad, curso } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Clave para sessionStorage basada en especialidad y curso
    const sessionKey = `ruletaAngle_${especialidad}_${curso}`;
    
    // Estados - Inicializar angle directamente desde sessionStorage
    const [spinning, setSpinning] = useState(false);
    const [angle, setAngle] = useState(() => {
        const sessionKey = `ruletaAngle_${especialidad}_${curso}`;
        try {
            const saved = sessionStorage.getItem(sessionKey);
            if (saved !== null && saved !== undefined && saved !== '') {
                const savedAngle = parseFloat(saved);
                console.log(`🎯 INICIALIZACIÓN (Avanzada): Cargando ángulo ${savedAngle}° desde sessionStorage`);
                return savedAngle;
            } else {
                console.log(`🎯 INICIALIZACIÓN (Avanzada): Sin ángulo guardado, iniciando en 0°`);
                return 0;
            }
        } catch (err) {
            console.error('❌ INICIALIZACIÓN (Avanzada): Error al cargar ángulo:', err);
            return 0;
        }
    });
    const [hoverGirar, setHoverGirar] = useState(false);
    const [hoverRegresar, setHoverRegresar] = useState(false);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [sectorActual, setSectorActual] = useState(null);
    const [ultimoSectorId, setUltimoSectorId] = useState(() => {
        // Cargar el último sector desde sessionStorage
        const sessionKeyUltimo = `ultimoSector_${especialidad}_${curso}`;
        try {
            const saved = sessionStorage.getItem(sessionKeyUltimo);
            return saved ? parseInt(saved, 10) : null;
        } catch {
            return null;
        }
    });
    const [sectoresSeleccionados, setSectoresSeleccionados] = useState(() => {
        // Cargar los sectores seleccionados desde sessionStorage
        const sessionKeySectores = `sectoresSeleccionados_${especialidad}_${curso}`;
        try {
            const saved = sessionStorage.getItem(sessionKeySectores);
            if (saved) {
                const parsedArray = JSON.parse(saved);
                console.log(`🎯 Cargando sectores seleccionados: [${parsedArray.join(', ')}]`);
                return Array.isArray(parsedArray) ? parsedArray : [];
            }
            return [];
        } catch (err) {
            console.error('Error al cargar sectores seleccionados:', err);
            return [];
        }
    });
    const [botonDeshabilitado, setBotonDeshabilitado] = useState(false);
    
    // Contador de progreso del curso
    const sessionKeyCurso = `contadorCurso_${curso || 'default'}`;
    const [totalPreguntasRespondidas, setTotalPreguntasRespondidas] = useState(() => {
        try {
            const saved = sessionStorage.getItem(sessionKeyCurso);
            return saved ? parseInt(saved, 10) : 0;
        } catch {
            return 0;
        }
    });
    
    // Sincronizar contador con sessionStorage
    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const saved = sessionStorage.getItem(sessionKeyCurso);
                if (saved) {
                    setTotalPreguntasRespondidas(parseInt(saved, 10));
                }
            } catch {}
        };
        
        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(handleStorageChange, 500);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [sessionKeyCurso]);

    // Detectar cambio de curso y resetear progreso del curso anterior
    useEffect(() => {
        const cursoAnteriorKey = 'ultimoCursoActivo';
        const cursoAnterior = sessionStorage.getItem(cursoAnteriorKey);
        
        if (cursoAnterior && cursoAnterior !== curso) {
            console.log(`🔄 Cambio de curso detectado en Ruleta: ${cursoAnterior} → ${curso}`);
            console.log(`🧹 Reseteando progreso del curso anterior (${cursoAnterior})...`);
            
            // Limpiar todas las claves relacionadas con el curso anterior
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                // Buscar claves que contengan el curso anterior
                if (key && (
                    key.includes(`_${cursoAnterior}`) || 
                    key.startsWith(`preguntasRespondidas_`) && key.endsWith(`_${cursoAnterior}`) ||
                    key === `contadorCurso_${cursoAnterior}` ||
                    key.startsWith(`ruletaAngle_`) && key.endsWith(`_${cursoAnterior}`) ||
                    key.startsWith(`ultimoSector_`) && key.endsWith(`_${cursoAnterior}`) ||
                    key.startsWith(`sectoresSeleccionados_`) && key.endsWith(`_${cursoAnterior}`)
                )) {
                    keysToRemove.push(key);
                }
            }
            
            // Eliminar todas las claves encontradas
            keysToRemove.forEach(key => {
                sessionStorage.removeItem(key);
                console.log(`  🗑️ Eliminada clave: ${key}`);
            });
            
            console.log(`✅ Progreso del curso ${cursoAnterior} reseteado completamente`);
            
            // Resetear estados locales
            setAngle(0);
            setUltimoSectorId(null);
            setSectoresSeleccionados([]);
            setTotalPreguntasRespondidas(0);
        }
        
        // Guardar el curso actual como el último activo
        if (curso) {
            sessionStorage.setItem(cursoAnteriorKey, curso);
        }
    }, [curso]);

    // === AUDIO SINTETIZADO TIPO RULETA ===
    const audioCtxRef = useRef(null);
    const oscRef = useRef(null);
    const gainRef = useRef(null);
    const lastTickIndexRef = useRef(null);
    const prevAngleRef = useRef(0);
    
    // Log para ver cuando cambia el ángulo en cada render
    useEffect(() => {
        console.log(`🔄 Ángulo actual en render (Avanzada): ${angle}°`);
    }, [angle]);

    // Guardar sectores seleccionados en sessionStorage cada vez que cambien
    useEffect(() => {
        const sessionKeySectores = `sectoresSeleccionados_${especialidad}_${curso}`;
        try {
            sessionStorage.setItem(sessionKeySectores, JSON.stringify(sectoresSeleccionados));
            if (sectoresSeleccionados.length > 0) {
                console.log(`💾 Guardando sectores seleccionados: [${sectoresSeleccionados.join(', ')}]`);
            }
        } catch (err) {
            console.error('Error al guardar sectores seleccionados:', err);
        }
    }, [sectoresSeleccionados, especialidad, curso]);

    useEffect(() => {
        // Inicializar AudioContext al montar
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
        } catch {}
        return () => stopWheelSound();
    }, []);

    function startWheelSound() {
        // El contexto ya está creado, no hacer nada
    }

    function stopWheelSound() {
        try {
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
                audioCtxRef.current = null;
            }
            oscRef.current = null;
            gainRef.current = null;
        } catch {}
    }

    function playTick() {
        try {
            const ctx = audioCtxRef.current;
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.06);
        } catch {}
    }

    function playSelectionSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            // Primer tono
            const osc1 = ctx.createOscillator();
            const g1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523, now); // C5
            g1.gain.setValueAtTime(0.3, now);
            g1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc1.connect(g1);
            g1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.3);
            // Segundo tono (armonía)
            const osc2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(659, now + 0.08); // E5
            g2.gain.setValueAtTime(0.0, now);
            g2.gain.setValueAtTime(0.25, now + 0.08);
            g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc2.connect(g2);
            g2.connect(ctx.destination);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.4);
            // Tercer tono
            const osc3 = ctx.createOscillator();
            const g3 = ctx.createGain();
            osc3.type = 'sine';
            osc3.frequency.setValueAtTime(784, now + 0.16); // G5
            g3.gain.setValueAtTime(0.0, now);
            g3.gain.setValueAtTime(0.2, now + 0.16);
            g3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc3.connect(g3);
            g3.connect(ctx.destination);
            osc3.start(now + 0.16);
            osc3.stop(now + 0.5);
            setTimeout(() => ctx.close(), 600);
        } catch {}
    }
    // === FIN AUDIO ===

    const ANGULO_POR_SECTOR = 360 / SECTORES_RUEDA.length;
    const OFFSET_INICIAL = -15; // Ajusta para centrar la flecha en el sector de Historia

    const determinarResultado = (anguloFinal) => {
        const numSectores = SECTORES_RUEDA.length;
        let anguloNormalizado = anguloFinal % 360;
        if (anguloNormalizado < 0) anguloNormalizado += 360;

        let anguloReferencia = (360 - anguloNormalizado + OFFSET_INICIAL) % 360;
        if (anguloReferencia < 0) anguloReferencia += 360;

        let anguloDesplazado = (anguloReferencia + ANGULO_POR_SECTOR / 2) % 360;
        if (anguloDesplazado < 0) anguloDesplazado += 360;

        let indiceSector = Math.floor(anguloDesplazado / ANGULO_POR_SECTOR);
        if (indiceSector >= numSectores) indiceSector = numSectores - 1;

        return SECTORES_RUEDA[indiceSector];
    };

    function iniciarGiro() {
        if (spinning) return;

        setSpinning(true);
        lastTickIndexRef.current = null;
        prevAngleRef.current = angle;
        startWheelSound();

        const vueltasMinimas = 6;
        const vueltasCompletas = 360 * vueltasMinimas;
        
        console.log(`🎲 === INICIO DE GIRO ===`);
        console.log(`📊 Sectores ya seleccionados: [${sectoresSeleccionados.join(', ')}] (${sectoresSeleccionados.length}/7)`);
        
        // Calcular sectores disponibles
        let sectoresDisponibles = SECTORES_RUEDA.filter(s => !sectoresSeleccionados.includes(s.id));
        if (sectoresDisponibles.length === 0) {
            console.log('🔄 ¡Ciclo completo! Todas las 7 materias visitadas. Reiniciando...');
            setSectoresSeleccionados([]);
            sectoresDisponibles = [...SECTORES_RUEDA];
        }
        
        console.log(`✅ Sectores disponibles: ${sectoresDisponibles.length}`);
        console.log(`   Opciones: [${sectoresDisponibles.map(s => `${s.id}:${s.nombre}`).join(', ')}]`);
        
        // Seleccionar un sector aleatorio y calcular el ángulo exacto del centro
        const sectorAleatorioIdx = Math.floor(Math.random() * SECTORES_RUEDA.length);
        
        // Calcular el ángulo del centro exacto del sector seleccionado
        const anguloAlCentroDelSector = sectorAleatorioIdx * ANGULO_POR_SECTOR + (ANGULO_POR_SECTOR / 2);
        
        let destinoTemporal = angle + vueltasCompletas + anguloAlCentroDelSector;
        
        // Calcular en qué sector caería
        let sectorDestino = determinarResultado(destinoTemporal);
        
        // Si el sector está repetido o es el último seleccionado, buscar el siguiente sector válido
        let vueltasAdicionales = 0;
        const MAX_INTENTOS = 20;
        let intentos = 0;
        
        while ((sectoresSeleccionados.includes(sectorDestino.id) || sectorDestino.id === ultimoSectorId) && intentos < MAX_INTENTOS) {
            vueltasAdicionales++;
            // Avanzar al centro del siguiente sector
            destinoTemporal = angle + vueltasCompletas + anguloAlCentroDelSector + (vueltasAdicionales * ANGULO_POR_SECTOR);
            sectorDestino = determinarResultado(destinoTemporal);
            intentos++;
        }
        
        // Si después de muchos intentos aún no encuentra uno válido, forzar al centro de un sector disponible
        if (intentos >= MAX_INTENTOS && sectoresDisponibles.length > 0) {
            const sectorForzado = sectoresDisponibles[Math.floor(Math.random() * sectoresDisponibles.length)];
            const sectorForzadoIdx = SECTORES_RUEDA.findIndex(s => s.id === sectorForzado.id);
            // Ir exactamente al centro del sector
            const anguloAlCentro = sectorForzadoIdx * ANGULO_POR_SECTOR + (ANGULO_POR_SECTOR / 2);
            const anguloActualNorm = ((angle % 360) + 360) % 360;
            let anguloNecesario = anguloAlCentro - anguloActualNorm;
            if (anguloNecesario < 0) anguloNecesario += 360;
            destinoTemporal = angle + vueltasCompletas + anguloNecesario;
            sectorDestino = sectorForzado;
            console.log(`⚠️ Ajuste forzado al centro del sector: ${sectorForzado.nombre}`);
        }
        
        const destino = destinoTemporal;
        console.log(`🎯 Destino calculado: ${(destino % 360).toFixed(2)}° → ${sectorDestino.nombre} (centro del sector)`);
        if (vueltasAdicionales > 0) {
            console.log(`   ➕ Se agregaron ${vueltasAdicionales} sectores adicionales para evitar repetición`);
        }

        const duracion = 4000;
        const inicio = performance.now();
        const angInicial = angle;

        function animar(t) {
            const p = Math.min((t - inicio) / duracion, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const actual = angInicial + (destino - angInicial) * eased;
            setAngle(actual);

            // Tick al cruzar borde de sector
            const norm = ((actual % 360) + 360) % 360;
            const idx = Math.floor(norm / ANGULO_POR_SECTOR);
            if (lastTickIndexRef.current !== idx) {
                const prevNorm = ((prevAngleRef.current % 360) + 360) % 360;
                const prevIdx = Math.floor(prevNorm / ANGULO_POR_SECTOR);
                if (((idx - prevIdx + SECTORES_RUEDA.length) % SECTORES_RUEDA.length) === 1) playTick();
                lastTickIndexRef.current = idx;
            }
            prevAngleRef.current = actual;

            if (p < 1) {
                requestAnimationFrame(animar);
            } else {
                // Animación completada
                finalizarGiro(actual);
            }
        }
        
        function finalizarGiro(anguloFinal) {
            stopWheelSound();
            playSelectionSound();
            setSpinning(false);
            setAngle(anguloFinal);
            
            // Guardar el ángulo final en sessionStorage
            try {
                console.log(`💾 Guardando ángulo (Avanzada): ${anguloFinal}° en clave: ${sessionKey}`);
                sessionStorage.setItem(sessionKey, anguloFinal.toString());
            } catch (err) {
                console.error('Error al guardar ángulo:', err);
            }
            
            const sectorGanador = determinarResultado(anguloFinal);
            console.log(`✅ Sector final válido: ID ${sectorGanador.id} - ${sectorGanador.nombre}`);
            
            // Deshabilitar el botón después del giro
            setBotonDeshabilitado(true);
            
            setSectorActual(sectorGanador);
            setUltimoSectorId(sectorGanador.id);
            setSectoresSeleccionados(prev => {
                const nuevaLista = [...prev, sectorGanador.id];
                console.log(`📝 Actualizando sectores seleccionados: [${nuevaLista.join(', ')}] (${nuevaLista.length}/7)`);
                return nuevaLista;
            });
            
            // Guardar el último sector en sessionStorage
            const sessionKeyUltimo = `ultimoSector_${especialidad}_${curso}`;
            try {
                sessionStorage.setItem(sessionKeyUltimo, sectorGanador.id.toString());
                console.log(`💾 Guardando último sector: ${sectorGanador.id} (${sectorGanador.nombre})`);
            } catch (err) {
                console.error('Error al guardar último sector:', err);
            }
            
            console.log(`🎲 === FIN DE GIRO ===`);
            
            // Mostrar modal instantáneamente
            setMostrarModal(true);
            
            // Esperar 4 segundos antes de navegar (3 segundos de modal + 1 segundo adicional)
            setTimeout(() => {
                setMostrarModal(false);
                
                // Esperar 1 segundo adicional después de cerrar el modal antes de navegar
                setTimeout(() => {
                    navigate(`/preguntas/${sectorGanador.ruta}`, { 
                        state: { 
                            nombreSector: sectorGanador.nombre,
                            origen: "avanzada",
                            especialidad,
                            curso,
                        } 
                    });

                    if (typeof onFinish === "function") onFinish(sectorGanador);
                }, 1000);
            }, 3000);
        }

        requestAnimationFrame(animar);
    }

    // Detectar tecla espacio para girar la ruleta
    useEffect(() => {
        const handleKeyPress = (event) => {
            // Solo activar si es la tecla espacio y la ruleta no está girando
            if (event.code === 'Space' && !spinning && !botonDeshabilitado) {
                event.preventDefault(); // Evitar scroll de página
                iniciarGiro();
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [spinning, botonDeshabilitado]);

    return (
        <div 
            style={{
                backgroundImage: `url(${fondoImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",    
                backgroundRepeat: "no-repeat",
                boxSizing: "border-box",
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Botón regresar (sin cambios de posición) */}
            <button
                onClick={() => {
                    if (location?.state?.fromAnsweredQuestion) {
                        navigate(`/cursos/${location.state.especialidad}`);
                    } else {
                        navigate(-1);
                    }
                }}
                onMouseEnter={() => setHoverRegresar(true)}
                onMouseLeave={() => setHoverRegresar(false)}
                onFocus={() => setHoverRegresar(true)}
                onBlur={() => setHoverRegresar(false)}
                onTouchStart={() => setHoverRegresar(true)}
                onTouchEnd={() => setHoverRegresar(false)}
                style={{
                    backgroundImage: `url('/src/assets/botones/regresar.png')`,
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
                    transform: `scale(${hoverRegresar ? 1.08 : 1})`,
                    transition: 'transform 160ms ease'
                }}
            ></button>

            {/* Contador de progreso del curso */}
            <div
                style={{
                    position: "fixed",
                    top: 30,
                    right: 80,
                    backgroundColor: "rgba(2, 29, 78, 0.93)",
                    color: "white",
                    padding: "12px 16px",
                    borderRadius: 12,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                    zIndex: 300,
                    minWidth: 120,
                    textAlign: "center",
                    border: "2px solid transparent",
                    fontFamily: "'Montserrat', sans-serif",
                }}
            >
                <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 4, fontFamily: "'Montserrat', sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>📊 Preguntas</div>
                <div style={{ fontSize: 20, fontWeight: "bold", fontFamily: "'Montserrat', sans-serif" }}>
                    {totalPreguntasRespondidas}
                </div>
            </div>

            {/* Contenedor de la ruleta: tamaño reducido y posición más baja */}
            <div 
                style={{ 
                    position: "relative", 
                    marginTop: "8vh",                  // mueve la ruleta más abajo
                    width: "min(80vmin, 680px)",        // tamaño reducido
                    height: "min(80vmin, 680px)",
                    maxWidth: "680px", 
                    maxHeight: "680px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <img
                    src={ruletaImg}
                    alt="ruleta"
                    style={{
                        width: "100%", 
                        height: "100%",
                        objectFit: "contain",
                        position: "absolute",
                        top: "51%", 
                        left: "54%", 
                        transform: `translate(-50%, -50%) rotate(${angle}deg)`, 
                        transformOrigin: "50% 50%",        
                        transition: spinning ? 'none' : 'transform 0.6s ease-out',
                        willChange: 'transform',
                        zIndex: 10,
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                    draggable={false}
                />

                {/* Flecha fija (sin cambios de posición) */}
                <img
                    src={flechaImg}
                    alt="flecha"
                    style={{
                        width: "12%", 
                        height: "auto",
                        position: "absolute", 
                        top: "4%", 
                        left: "55%", 
                        transform: "translateX(-50%)",          
                        zIndex: 30,
                        pointerEvents: "none",
                    }}
                    draggable={false}
                />
            </div>

            {/* Botón girar (sin cambios de posición) */}
            <button
                onClick={iniciarGiro}
                disabled={spinning || botonDeshabilitado}
                onMouseEnter={() => setHoverGirar(true)}
                onMouseLeave={() => setHoverGirar(false)}
                onFocus={() => setHoverGirar(true)}
                onBlur={() => setHoverGirar(false)}
                onTouchStart={() => setHoverGirar(true)}
                onTouchEnd={() => setHoverGirar(false)}
                style={{
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'transparent',
                    width: 250,
                    height: 60,
                    border: 'none',
                    cursor: 'pointer',
                    position: 'absolute',
                    bottom: '50px',
                    left: '50%',
                    transform: `translateX(-50%) scale(${hoverGirar ? 1.08 : 1})`,
                    transition: 'transform 160ms ease',
                }}
            >
                <img
                    src={botonGirarImg}
                    alt="Botón girar"
                    style={{
                        width: "100%", 
                        height: "auto",
                        opacity: spinning ? 0.6 : 1,
                        pointerEvents: spinning ? "none" : "auto",
                        position: "relative",
                        top: "15px",
                        left: "7%",
                    }}
                />
            </button>

            {/* Modal emergente */}
            {mostrarModal && sectorActual && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            padding: "40px",
                            borderRadius: "15px",
                            textAlign: "center",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            maxWidth: "400px",
                            animation: "slideIn 0.3s ease-out",
                        }}
                    >
                        <p style={{ fontSize: "32px", color: "#0066cc", fontWeight: "bold", marginBottom: "20px", fontFamily: "'Montserrat', sans-serif" }}>
                            {sectorActual.nombre.replace(/^Sector \d+:\s*/, "")}
                        </p>
                        <p style={{ fontSize: "14px", color: "#666", fontFamily: "'Montserrat', sans-serif" }}>
                            Cargando preguntas en 3 segundos...
                        </p>
                    </div>
                </div>
            )}

            <style>
                {`
                    @keyframes slideIn {
                        from {
                            transform: scale(0.8);
                            opacity: 0;
                        }
                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                `}
            </style>
        </div>
    );
}
// ...existing code...