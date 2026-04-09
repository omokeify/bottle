import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Text, Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

// --- 3D Components ---

const Bottle = ({ product, scrollContainer, isConfigurator = false }: any) => {
  const groupRef = useRef<THREE.Group>(null);
  const rotationTarget = useRef({ x: 0, y: 0, z: 0 });
  const mouseRotation = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    // Load the uploaded image texture
    new THREE.TextureLoader().load(
      '/bottle.png',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      },
      undefined,
      (err) => console.warn('Image not found. Please upload bottle.png to the public folder.')
    );
  }, []);

  useEffect(() => {
    if (groupRef.current) {
      gsap.to(rotationTarget.current, {
        y: rotationTarget.current.y + Math.PI * 2,
        duration: 1.4,
        ease: "power4.inOut"
      });
      
      gsap.timeline()
        .to(groupRef.current.scale, { x: 0.8, y: 0.8, z: 0.8, duration: 0.2, ease: "power2.in" })
        .to(groupRef.current.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "elastic.out(1, 0.4)" });
    }
  }, [product]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    e.target.setPointerCapture?.(e.pointerId);
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    e.target.releasePointerCapture?.(e.pointerId);
    isDragging.current = false;
    document.body.style.cursor = 'grab';
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    const deltaX = e.clientX - previousMouse.current.x;
    const deltaY = e.clientY - previousMouse.current.y;
    mouseRotation.current.y += deltaX * 0.005;
    mouseRotation.current.x += deltaY * 0.005;
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  useFrame((state) => {
    if (!groupRef.current) return;

    if (isConfigurator) {
      groupRef.current.rotation.x = mouseRotation.current.x;
      groupRef.current.rotation.y = mouseRotation.current.y + state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.z = 0;
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.scale.setScalar(1);
      return;
    }

    let scrollProgress = 0;
    if (scrollContainer && scrollContainer.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer.current;
      const maxScroll = scrollHeight - clientHeight;
      scrollProgress = maxScroll > 0 ? scrollTop / maxScroll : 0;
    }
    
    scrollProgress = Math.min(Math.max(scrollProgress, 0), 1);
    
    const viewportWidth = state.viewport.width;
    const viewportHeight = state.viewport.height;
    const isMobile = viewportWidth < viewportHeight;
    
    let startY = 0;
    if (isMobile) startY = 1.2;
    
    const pos1 = new THREE.Vector3(0, startY, 0);
    const scale1 = isMobile ? 0.6 : 0.8;
    
    const pos2 = new THREE.Vector3(viewportWidth / 3.5, 0, 0);
    const scale2 = isMobile ? 0.9 : 1.2;
    
    const pos3 = new THREE.Vector3(-viewportWidth / 3.5, 0, 0);
    const scale3 = isMobile ? 0.9 : 1.2;
    
    const pos4 = new THREE.Vector3(0, 0, 0);
    const scale4 = isMobile ? 0.7 : 0.9;
    
    let targetPos = new THREE.Vector3();
    let targetScale = 1;
    let rotationMultiplier = 1;

    const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;

    if (scrollProgress <= 0.33) {
      const p = easeInOutSine(scrollProgress * 3);
      targetPos.lerpVectors(pos1, pos2, p);
      targetScale = THREE.MathUtils.lerp(scale1, scale2, p);
    } else if (scrollProgress <= 0.66) {
      const p = easeInOutSine((scrollProgress - 0.33) * 3);
      targetPos.lerpVectors(pos2, pos3, p);
      targetScale = THREE.MathUtils.lerp(scale2, scale3, p);
    } else {
      const p = easeInOutSine((scrollProgress - 0.66) * 3);
      targetPos.lerpVectors(pos3, pos4, p);
      targetPos.y += Math.sin(p * Math.PI) * 2; // arc
      targetScale = THREE.MathUtils.lerp(scale3, scale4, p);
      rotationMultiplier = 1 - p;
    }

    groupRef.current.position.lerp(targetPos, 0.08);
    
    rotationTarget.current.z = THREE.MathUtils.lerp(rotationTarget.current.z, 0, 0.1);
    
    if (rotationMultiplier > 0.01) {
      rotationTarget.current.y = scrollProgress * Math.PI * 4;
      rotationTarget.current.x = THREE.MathUtils.lerp(rotationTarget.current.x, 0.2, 0.1);
    } else {
      rotationTarget.current.x = THREE.MathUtils.lerp(rotationTarget.current.x, 0, 0.1);
      rotationTarget.current.y += 0.002;
    }

    if (scrollProgress > 0.05 && !isDragging.current) {
      mouseRotation.current.x = THREE.MathUtils.lerp(mouseRotation.current.x, 0, 0.1);
      mouseRotation.current.y = THREE.MathUtils.lerp(mouseRotation.current.y, 0, 0.1);
    }

    groupRef.current.rotation.x = rotationTarget.current.x + mouseRotation.current.x;
    groupRef.current.rotation.y = rotationTarget.current.y + mouseRotation.current.y;
    groupRef.current.rotation.z = rotationTarget.current.z;

    if (scrollProgress < 0.05) {
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime) * 0.05 * 0.05;
    }

    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.1));
  });

  return (
    <group 
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerOver={() => { if (!isDragging.current) document.body.style.cursor = 'grab'; }}
      onPointerOut={() => { if (!isDragging.current) document.body.style.cursor = 'auto'; }}
    >
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        {texture ? (
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <planeGeometry args={[3, 5.5]} />
            <meshStandardMaterial 
              map={texture} 
              transparent={true} 
              alphaTest={0.05} 
              side={THREE.DoubleSide}
              roughness={0.4}
            />
          </mesh>
        ) : (
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <planeGeometry args={[3, 5.5]} />
            <meshStandardMaterial color={product.primaryColor} wireframe side={THREE.DoubleSide} />
          </mesh>
        )}
      </Float>
    </group>
  );
};

const Scene = ({ currentProduct, scrollContainer }: any) => {
  return (
    <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 35 }} className="pointer-events-auto" style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={0.4} />
        <spotLight position={[-5, 10, 5]} angle={0.3} penumbra={1} intensity={2} castShadow shadow-bias={-0.0001} color="#ffffff" />
        <spotLight position={[5, 0, -5]} angle={0.5} penumbra={1} intensity={5} color={currentProduct.accentColor} />
        <pointLight position={[-5, 0, 5]} intensity={0.8} color="#4a5568" />
        <Bottle product={currentProduct} scrollContainer={scrollContainer} />
        <Environment preset="city" />
        <ContactShadows position={[0, -2.8, 0]} opacity={0.5} scale={20} blur={2} far={4.5} />
      </Canvas>
    </div>
  );
};

// --- UI Components ---

const AnimatedText = ({ text, delay }: { text: string, delay: number }) => {
  const textRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    if (!textRef.current) return;
    const chars = textRef.current.querySelectorAll('.char');
    gsap.killTweensOf(chars);
    gsap.fromTo(chars, 
      { y: 120, opacity: 0, scale: 0.8, filter: "blur(15px)", rotateX: -45 },
      { y: 0, opacity: 0.4, scale: 1, filter: "blur(0px)", rotateX: 0, duration: 1.4, stagger: 0.06, ease: "power4.out", delay }
    );
  }, [text, delay]);

  return (
    <span ref={textRef} className="inline-flex relative perspective-1000" style={{ perspective: '1000px' }}>
      {text.split('').map((char, i) => (
        <span key={`${text}-${i}`} className="char inline-block will-change-transform origin-bottom" style={{ transformStyle: 'preserve-3d' }}>
          {char}
        </span>
      ))}
    </span>
  );
};

const TitleOverlay = ({ product, scrollRef }: any) => {
  const bgTextRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef?.current || !bgTextRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      
      if (progress > 0.8) {
        bgTextRef.current.style.opacity = "0.1";
        bgTextRef.current.style.transform = `translateY(${(progress - 0.8) * -50}px)`;
      } else {
        bgTextRef.current.style.opacity = "0";
      }
    };
    
    const el = scrollRef?.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => { if (el) el.removeEventListener('scroll', handleScroll); };
  }, [scrollRef]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <div className="flex absolute inset-0 flex-row items-start justify-center pt-[48vh] md:items-center md:pt-0">
        <h1 key={`title-dt-${product.id}`} className="font-display font-bold text-[16vw] md:text-[18vw] leading-none text-white tracking-widest mix-blend-overlay flex flex-row items-center gap-3 md:gap-[12vw]">
          <AnimatedText text={product.namePart1} delay={0} />
          <AnimatedText text={product.namePart2} delay={0.2} />
        </h1>
      </div>
      <div ref={bgTextRef} className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-1000">
        <h1 className="font-display text-[25vw] text-white tracking-widest translate-y-[-10vh]">ZEST</h1>
      </div>
    </div>
  );
};

const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const xToDot = gsap.quickTo(dotRef.current, "x", { duration: 0.001 });
    const yToDot = gsap.quickTo(dotRef.current, "y", { duration: 0.001 });
    const xToRing = gsap.quickTo(ringRef.current, "x", { duration: 0.2, ease: "power3" });
    const yToRing = gsap.quickTo(ringRef.current, "y", { duration: 0.2, ease: "power3" });

    const onMouseMove = (e: MouseEvent) => {
      xToDot(e.clientX);
      yToDot(e.clientY);
      xToRing(e.clientX);
      yToRing(e.clientY);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a') || target.classList.contains('interactive')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
    };
  }, []);

  useEffect(() => {
    if (isHovering) {
      gsap.to(ringRef.current, { scale: 3, opacity: 0.15, backgroundColor: "#ffffff", duration: 0.3 });
      gsap.to(dotRef.current, { scale: 0.5, backgroundColor: "transparent", duration: 0.3 });
    } else {
      gsap.to(ringRef.current, { scale: 1, opacity: 0.5, backgroundColor: "white", duration: 0.3 });
      gsap.to(dotRef.current, { scale: 1, backgroundColor: "white", duration: 0.3 });
    }
  }, [isHovering]);

  return (
    <>
      <style>{`body, a, button { cursor: none !important; }`}</style>
      <div ref={dotRef} className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference -translate-x-1/2 -translate-y-1/2 will-change-transform" />
      <div ref={ringRef} className="fixed top-0 left-0 w-8 h-8 border border-white rounded-full pointer-events-none z-[9998] mix-blend-difference -translate-x-1/2 -translate-y-1/2 will-change-transform" />
    </>
  );
};

const PRODUCTS = [
  { id: 1, namePart1: "BERRY", namePart2: "BLISS", price: 6.99, primaryColor: "#c93a5c", accentColor: "#ff4d6d", description: "Rich, tart, and full of antioxidants." },
  { id: 2, namePart1: "CITRUS", namePart2: "SURGE", price: 5.99, primaryColor: "#eab308", accentColor: "#facc15", description: "Zesty, bright, and instantly refreshing." },
  { id: 3, namePart1: "MANGO", namePart2: "GLOW", price: 7.99, primaryColor: "#ea580c", accentColor: "#f97316", description: "Tropical, smooth, and naturally sweet." },
  { id: 4, namePart1: "GREEN", namePart2: "DETOX", price: 8.99, primaryColor: "#22c55e", accentColor: "#4ade80", description: "Cleanse your body with pure greens." },
  { id: 5, namePart1: "BLUE", namePart2: "MYSTIC", price: 7.49, primaryColor: "#3b82f6", accentColor: "#60a5fa", description: "Cool, crisp, with a hint of blueberry." }
];

export default function App() {
  const [products, setProducts] = useState(PRODUCTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const currentProduct = products[currentIndex];

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % products.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0', 'translate-x-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10', '-translate-x-10', 'translate-x-10', '-translate-y-20');
        } else {
          entry.target.classList.remove('opacity-100', 'translate-y-0', 'translate-x-0');
          entry.target.classList.add('opacity-0');
        }
      });
    }, { threshold: 0.3 });

    if (scrollRef.current) {
      scrollRef.current.querySelectorAll('.animate-item').forEach(el => observer.observe(el));
    }
    return () => observer.disconnect();
  }, [currentProduct]);

  return (
    <>
      <CustomCursor />
      <div 
        className="relative w-full h-screen flex items-center justify-center overflow-hidden p-0 md:p-8 select-none transition-colors duration-1000"
        style={{ backgroundColor: currentProduct.primaryColor }}
      >
        <div className="relative w-full h-full md:max-w-[1600px] md:max-h-[900px] bg-brand-dark md:rounded-[2.5rem] shadow-2xl flex flex-col border-0 md:border border-white/5 overflow-hidden">
          
          {/* Background Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/30 via-black to-black opacity-80 pointer-events-none z-0" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20 pointer-events-none z-0" style={{
            background: "repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.05) 50px)",
            transform: "perspective(500px) rotateX(60deg) scale(2)",
            transformOrigin: "bottom center",
            maskImage: "linear-gradient(to top, black, transparent)"
          }} />

          {/* 3D Scene */}
          <Scene currentProduct={currentProduct} scrollContainer={scrollRef} />

          {/* Scrollable Content */}
          <div ref={scrollRef} className="absolute inset-0 z-30 w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar snap-y snap-mandatory">
            
            {/* Section 1: Hero */}
            <div className="relative w-full h-full min-h-full flex flex-col md:block snap-start">
              <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-6 md:py-8 w-full pointer-events-none md:pointer-events-auto">
                <div className="flex items-center gap-2 pointer-events-auto">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-xl">
                    Z
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-display font-bold text-white text-lg tracking-wider">ZESTIFY</span>
                    <span className="font-display font-bold text-white text-lg tracking-wider -mt-1">JUICE</span>
                  </div>
                </div>
                <div className="hidden md:flex gap-12 pointer-events-auto">
                  <button className="text-sm font-medium tracking-wide transition-colors duration-300 interactive text-white">Shop</button>
                  <button className="text-sm font-medium tracking-wide transition-colors duration-300 interactive text-gray-300 hover:text-white">About</button>
                  <button className="text-sm font-medium tracking-wide transition-colors duration-300 interactive text-gray-300 hover:text-white">Flavors</button>
                </div>
                <div className="flex items-center gap-6 text-white pointer-events-auto pr-2 md:pr-0">
                  <button className="hover:text-white/80 transition-colors relative interactive">
                    <ShoppingBag className="w-6 h-6" />
                  </button>
                </div>
              </nav>

              <TitleOverlay product={currentProduct} scrollRef={scrollRef} />

              <div className="relative w-full h-full pointer-events-none flex flex-col justify-end z-10">
                <div className="w-full px-6 md:px-16 pb-6 md:pb-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mt-auto md:mt-0 pointer-events-none">
                  <div className="flex flex-col gap-2 w-full md:w-auto text-center md:text-left pointer-events-auto items-center md:items-start">
                    <div className="font-sans text-6xl md:text-5xl font-light tracking-wide drop-shadow-2xl text-white">
                      ${currentProduct.price}
                    </div>
                    <div className="text-gray-400 text-xs tracking-wider uppercase font-medium flex items-center gap-2">
                      Size: <span className="text-white">16oz Cold-Pressed</span> <span className="w-1 h-1 bg-white/50 rounded-full" /> Organic
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2 md:bottom-12 pointer-events-auto order-last md:order-none mt-4 md:mt-0 flex justify-center gap-4">
                    <button className="interactive group relative w-full md:w-auto overflow-hidden rounded-sm px-14 py-5 shadow-glow transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ backgroundColor: currentProduct.accentColor }}>
                      <div className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                      <span className="relative z-10 text-white font-bold text-sm tracking-[0.2em] uppercase">Add to cart</span>
                    </button>
                  </div>

                  <div className="absolute top-1/2 right-4 -translate-y-1/2 md:static md:translate-y-0 flex flex-col items-end gap-8 pointer-events-auto">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <button onClick={handlePrev} className="interactive nav-btn group" aria-label="Previous">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 flex items-center justify-center text-white bg-black/20 backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-110 group-active:scale-95">
                          <ChevronLeft className="w-5 h-5" />
                        </div>
                      </button>
                      <button onClick={handleNext} className="interactive nav-btn group" aria-label="Next">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 flex items-center justify-center text-white bg-black/20 backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-110 group-active:scale-95">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Performance Metrics */}
            <div className="relative w-full h-full min-h-full flex items-center px-6 md:px-20 py-20 pointer-events-none snap-start overflow-hidden">
              <div className="w-full h-full relative z-10 pointer-events-auto flex items-center justify-between">
                <div className="w-full md:w-1/3 flex flex-col justify-center gap-12 pl-2 md:pl-0">
                  <div className="animate-item transition-all duration-1000 opacity-0 translate-y-10 delay-100">
                    <div className="text-xs font-mono text-white/80 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white" /> PURE INGREDIENTS
                    </div>
                    <h2 className="font-display text-5xl md:text-7xl text-white leading-[0.9] tracking-tight">
                      RAW<br />VITALITY
                    </h2>
                  </div>
                  <div className="space-y-8">
                    <div className="animate-item transition-all duration-1000 opacity-0 translate-y-10 delay-200 border-l border-white/20 pl-6">
                      <div className="text-4xl font-bold text-white mb-1">100%</div>
                      <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Organic Produce</div>
                      <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">Sourced directly from local farms to ensure the highest quality and freshest taste.</p>
                    </div>
                    <div className="animate-item transition-all duration-1000 opacity-0 translate-y-10 delay-300 border-l border-white/20 pl-6">
                      <div className="text-4xl font-bold text-white mb-1">0<span className="text-lg text-gray-500">g</span></div>
                      <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Added Sugar</div>
                      <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">Naturally sweetened by the fruits themselves. No artificial additives or preservatives.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Aerodynamics */}
            <div className="relative w-full h-full min-h-full flex items-center justify-end px-6 md:px-16 py-20 pointer-events-none snap-start overflow-hidden">
              <div className="w-full md:w-5/12 relative z-10 pointer-events-auto text-right">
                <div className="animate-item transition-all duration-1000 opacity-0 translate-x-10 delay-100">
                  <div className="inline-block px-3 py-1 border border-white/30 rounded-full text-[10px] font-mono text-white mb-4 tracking-widest">EXTRACTION</div>
                  <h2 className="font-display text-5xl md:text-8xl text-white mb-6">COLD<br />PRESSED</h2>
                </div>
                <div className="animate-item transition-all duration-1000 opacity-0 translate-x-10 delay-200 flex flex-col items-end gap-6">
                  <div className="flex items-center gap-4 group">
                    <div className="text-right">
                      <div className="text-3xl font-bold font-mono text-white transition-colors">0%</div>
                      <div className="text-[10px] text-gray-400 uppercase">Heat Applied</div>
                    </div>
                    <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="text-right">
                      <div className="text-3xl font-bold font-mono text-white transition-colors">100%</div>
                      <div className="text-[10px] text-gray-400 uppercase">Nutrient Retention</div>
                    </div>
                    <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="animate-item transition-all duration-1000 opacity-0 translate-y-10 delay-400 mt-12 pt-12">
                  <p className="text-gray-400 text-sm leading-relaxed max-w-sm ml-auto">
                    Our hydraulic press extraction method ensures maximum vitamin, mineral, and enzyme retention, delivering pure liquid vitality.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: The Champion */}
            <div className="relative w-full h-full min-h-full flex flex-col items-center justify-start pt-16 px-6 pointer-events-none snap-start">
              <div className="text-center pointer-events-auto z-20 relative -mt-7">
                <div className="inline-flex flex-col items-center">
                  <div className="text-xs font-mono text-gray-400 tracking-[0.5em] mb-2">LIMITED BATCH</div>
                  <h2 className="animate-item transition-all duration-1000 opacity-0 -translate-y-20 delay-100 font-display text-5xl md:text-7xl text-white tracking-[0.1em] drop-shadow-lg">THE REFRESHER</h2>
                </div>
              </div>
              <div className="animate-item transition-all duration-1000 opacity-0 translate-y-10 delay-400 absolute bottom-8 left-0 w-full text-center">
                <p className="text-white/30 text-[10px] tracking-widest uppercase">
                  © 2026 ZESTIFY JUICE. BOTTLED VITALITY.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
