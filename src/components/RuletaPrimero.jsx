import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import fondoRuletaImg from "../assets/fondos/fondoruleta.png";
import ruletaImg from "../assets/ruleta/ruleta_1.png";
import flechaImg from "../assets/ruleta/flecha.png";
import botonGirarImg from "../assets/botones/girar.png";

const SECTORES_RUEDA = [
    { id: 1, nombre: "Relaciones lógico matemáticas", ruta: "relaciones-logico-matematicas" },
    { id: 2, nombre: "Expresión oral y escrita", ruta: "expresion-oral-y-escrita" },
    { id: 3, nombre: "Identidad y Autonomía", ruta: "identidad-y-autonomia" },
    { id: 4, nombre: "Inglés", ruta: "ingles" },
    { id: 5, nombre: "Descubrimiento del medio natural y cultural", ruta: "descubrimiento-medio-natural-cultural" },
];

// Valores fijos para esta ruleta: Preparatoria > Primero
const ESPECIALIDAD_FIJA = "preparatoria";
const CURSO_FIJO = "1ro";

export default function RuletaPrimero({ onFinish }) {
    useParams(); // mantenido por compatibilidad con el router
    const navigate = useNavigate();
    const location = useLocation();

    // Usar valores fijos porque esta ruta no tiene :especialidad/:curso en la URL
    const especialidad = ESPECIALIDAD_FIJA;
    const curso = CURSO_FIJO;

    const sessionKey = useMemo(() => `ruletaAngle_${especialidad}_${curso}`, [especialidad, curso]);

    const [spinning, setSpinning] = useState(false);
    const [angle, setAngle] = useState(() => {
        const key = `ruletaAngle_${especialidad}_${curso}`;
        try {
            const saved = sessionStorage.getItem(key);
            return saved ? parseFloat(saved) : 0;
        } catch { return 0; }
    });
    const [hoverGirar, setHoverGirar] = useState(false);
    const [hoverRegresar, setHoverRegresar] = useState(false);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [sectorActual, setSectorActual] = useState(null);
    const [botonDeshabilitado, setBotonDeshabilitado] = useState(false);
    const [ultimoSectorId, setUltimoSectorId] = useState(() => {
        const key = `ultimoSector_${especialidad}_${curso}`;
        try {
            const saved = sessionStorage.getItem(key);
            return saved ? parseInt(saved, 10) : null;
        } catch { return null; }
    });
    const [sectoresSeleccionados, setSectoresSeleccionados] = useState(() => {
        const key = `sectoresSeleccionados_${especialidad}_${curso}`;
        try {
            const saved = sessionStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch { return []; }
    });

    const sessionKeyCurso = useMemo(() => `contadorCurso_${curso || 'default'}`, [curso]);
    const [totalPreguntasRespondidas, setTotalPreguntasRespondidas] = useState(() => {
        try {
            const saved = sessionStorage.getItem(sessionKeyCurso);
            return saved ? parseInt(saved, 10) : 0;
        } catch { return 0; }
    });

    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const saved = sessionStorage.getItem(sessionKeyCurso);
                if (saved) setTotalPreguntasRespondidas(parseInt(saved, 10));
            } catch {}
        };
        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(handleStorageChange, 500);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [sessionKeyCurso]);

    useEffect(() => {
        const key = `sectoresSeleccionados_${especialidad}_${curso}`;
        try {
            sessionStorage.setItem(key, JSON.stringify(sectoresSeleccionados));
        } catch {}
    }, [sectoresSeleccionados, especialidad, curso]);

    const audioCtxRef = useRef(null);
    const lastTickIndexRef = useRef(null);
    const prevAngleRef = useRef(0);

    useEffect(() => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
        } catch {}
        return () => stopWheelSound();
    }, []);

    function stopWheelSound() {
        try {
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
                audioCtxRef.current = null;
            }
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
            [[523, 0], [659, 0.08], [784, 0.16]].forEach(([freq, delay]) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + delay);
                g.gain.setValueAtTime(delay === 0 ? 0.3 : 0.0, now);
                if (delay > 0) g.gain.setValueAtTime(0.25, now + delay);
                g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
                osc.connect(g);
                g.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 0.35);
            });
            setTimeout(() => ctx.close(), 600);
        } catch {}
    }

    const ANGULO_POR_SECTOR = 360 / SECTORES_RUEDA.length; // 72° por sector
    // La imagen en reposo tiene el sector 1 (Relaciones) centrado a 36° a la derecha del tope (arriba).
    // El apuntador está arriba → offset = -(ANGULO_POR_SECTOR / 2) = -36
    const OFFSET_INICIAL = -36;

    const determinarResultado = (anguloFinal) => {
        const numSectores = SECTORES_RUEDA.length;
        let norm = anguloFinal % 360;
        if (norm < 0) norm += 360;
        let ref = (360 - norm + OFFSET_INICIAL + ANGULO_POR_SECTOR / 2.5) % 360;
        if (ref < 0) ref += 360;
        let idx = Math.floor(ref / ANGULO_POR_SECTOR);
        if (idx >= numSectores) idx = numSectores - 1;
        return SECTORES_RUEDA[idx];
    };

    function iniciarGiro() {
        if (spinning) return;
        setSpinning(true);
        lastTickIndexRef.current = null;
        prevAngleRef.current = angle;

        const vueltasCompletas = 360 * 6;
        let sectoresDisponibles = SECTORES_RUEDA.filter(s => !sectoresSeleccionados.includes(s.id));
        if (sectoresDisponibles.length === 0) {
            setSectoresSeleccionados([]);
            sectoresDisponibles = [...SECTORES_RUEDA];
        }

        const sectorAleatorioIdx = Math.floor(Math.random() * SECTORES_RUEDA.length);
        const anguloAlCentro = sectorAleatorioIdx * ANGULO_POR_SECTOR + (ANGULO_POR_SECTOR / 2);
        let destino = angle + vueltasCompletas + anguloAlCentro;
        let sectorDestino = determinarResultado(destino);

        let vueltasAdicionales = 0;
        let intentos = 0;
        while ((sectoresSeleccionados.includes(sectorDestino.id) || sectorDestino.id === ultimoSectorId) && intentos < 20) {
            vueltasAdicionales++;
            destino = angle + vueltasCompletas + anguloAlCentro + (vueltasAdicionales * ANGULO_POR_SECTOR);
            sectorDestino = determinarResultado(destino);
            intentos++;
        }

        if (intentos >= 20 && sectoresDisponibles.length > 0) {
            const forzado = sectoresDisponibles[Math.floor(Math.random() * sectoresDisponibles.length)];
            const forzadoIdx = SECTORES_RUEDA.findIndex(s => s.id === forzado.id);
            const anguloForzado = forzadoIdx * ANGULO_POR_SECTOR + (ANGULO_POR_SECTOR / 2);
            const normActual = ((angle % 360) + 360) % 360;
            let necesario = anguloForzado - normActual;
            if (necesario < 0) necesario += 360;
            destino = angle + vueltasCompletas + necesario;
            sectorDestino = forzado;
        }

        const duracion = 4000;
        const inicio = performance.now();
        const angInicial = angle;

        function animar(t) {
            const p = Math.min((t - inicio) / duracion, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const actual = angInicial + (destino - angInicial) * eased;
            setAngle(actual);

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
                finalizarGiro(actual);
            }
        }

        function finalizarGiro(anguloFinal) {
            stopWheelSound();
            playSelectionSound();
            setSpinning(false);
            setAngle(anguloFinal);
            try { sessionStorage.setItem(sessionKey, anguloFinal.toString()); } catch {}

            const sectorGanador = determinarResultado(anguloFinal);
            setBotonDeshabilitado(true);
            setSectorActual(sectorGanador);
            setUltimoSectorId(sectorGanador.id);
            setSectoresSeleccionados(prev => [...prev, sectorGanador.id]);

            try {
                sessionStorage.setItem(`ultimoSector_${especialidad}_${curso}`, sectorGanador.id.toString());
            } catch {}

            setMostrarModal(true);
            setTimeout(() => {
                setMostrarModal(false);
                console.log(`🚀 Navegando a /preguntas/${sectorGanador.ruta} con curso="${curso}", especialidad="${especialidad}"`);
                navigate(`/preguntas/${sectorGanador.ruta}`, {
                    state: { nombreSector: sectorGanador.nombre, origen: "primero", especialidad, curso }
                });
                if (typeof onFinish === "function") onFinish(sectorGanador);
            }, 3000);
        }

        requestAnimationFrame(animar);
    }

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.code === 'Space' && !spinning && !botonDeshabilitado) {
                e.preventDefault();
                iniciarGiro();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [spinning, botonDeshabilitado]);

    return (
        <div style={{
            backgroundImage: `url(${fondoRuletaImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Botón regresar */}
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
                style={{
                    backgroundImage: `url('/src/assets/botones/regresar.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'transparent',
                    width: 180, height: 60,
                    border: 'none', cursor: 'pointer',
                    position: 'absolute', bottom: '30px', left: '30px',
                    transform: `scale(${hoverRegresar ? 1.08 : 1})`,
                    transition: 'transform 160ms ease'
                }}
            />

            {/* Contador de progreso */}
            <div style={{
                position: "fixed", top: 30, right: 80,
                backgroundColor: "rgba(2, 29, 78, 0.93)",
                color: "white", padding: "12px 16px", borderRadius: 12,
                boxShadow: "0 4px 16px rgba(0,0,0,0.25)", zIndex: 300,
                minWidth: 120, textAlign: "center",
                fontFamily: "'Montserrat', sans-serif",
            }}>
                <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>📊 Preguntas</div>
                <div style={{ fontSize: 20, fontWeight: "bold" }}>{totalPreguntasRespondidas}</div>
            </div>

            {/* Ruleta */}
            <div style={{
                position: "relative", marginTop: "5vh",
                width: "min(85vmin, 700px)", height: "min(85vmin, 700px)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <img
                    src={ruletaImg} alt="ruleta"
                    style={{
                        width: "min(80vmin, 800px)", height: "min(80vmin, 800px)",
                        position: "absolute", top: "53%", left: "55%",
                        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                        transformOrigin: "50% 51%",
                        transition: spinning ? 'none' : 'transform 0.6s ease-out',
                        willChange: 'transform', zIndex: 10,
                        userSelect: "none", pointerEvents: "none",
                    }}
                    draggable={false}
                />
                <img
                    src={flechaImg} alt="flecha"
                    style={{
                        width: "12%", height: "auto",
                        position: "absolute", top: "8%", left: "55%",
                        transform: "translateX(-50%)", zIndex: 30, pointerEvents: "none",
                    }}
                    draggable={false}
                />
            </div>

            {/* Botón girar */}
            <button
                onClick={iniciarGiro}
                disabled={spinning || botonDeshabilitado}
                onMouseEnter={() => setHoverGirar(true)}
                onMouseLeave={() => setHoverGirar(false)}
                style={{
                    backgroundColor: 'transparent', width: 250, height: 60,
                    border: 'none', cursor: 'pointer',
                    position: 'absolute', bottom: '50px', left: '51%',
                    transform: `translateX(-50%) scale(${hoverGirar ? 1.08 : 1})`,
                    transition: 'transform 160ms ease', zIndex: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <img
                    src={botonGirarImg} alt="Botón girar"
                    style={{
                        width: "100%", height: "auto",
                        opacity: (spinning || botonDeshabilitado) ? 0.6 : 1,
                        pointerEvents: (spinning || botonDeshabilitado) ? "none" : "auto",
                    }}
                    draggable={false}
                />
            </button>

            {/* Modal */}
            {mostrarModal && sectorActual && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
                }}>
                    <div style={{
                        backgroundColor: "white", padding: "40px", borderRadius: "15px",
                        textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                        maxWidth: "400px", animation: "slideIn 0.3s ease-out",
                    }}>
                        <p style={{ fontSize: "32px", color: "#0066cc", fontWeight: "bold", marginBottom: "20px", fontFamily: "'Montserrat', sans-serif" }}>
                            {sectorActual.nombre}
                        </p>
                        <p style={{ fontSize: "14px", color: "#666", fontFamily: "'Montserrat', sans-serif" }}>
                            Cargando preguntas en 3 segundos...
                        </p>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
