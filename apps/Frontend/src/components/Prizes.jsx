import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SplitType from 'split-type';
import ThreeScene from '../utils/ThreeScene';
import '../css/prizes.css';

gsap.registerPlugin(ScrollTrigger);

const Prizes = () => {
    const containerRef = useRef(null);
    const leftCanvasRef = useRef(null);
    const rightCanvasRef = useRef(null);
    const smallDiceCanvasRef = useRef(null); 
    const leftCardRef = useRef(null);
    const rightCardRef = useRef(null);
    
    const leftSceneRef = useRef(null);
    const rightSceneRef = useRef(null);
    const smallDiceSceneRef = useRef(null);

    useEffect(() => {
        
        if(leftCanvasRef.current) {
            leftSceneRef.current = new ThreeScene(leftCanvasRef.current);
            // The third argument controls size
            leftSceneRef.current.loadModel('/assests/dice.glb', { x: 0, y: 0, z: 0 }, 1, { x: 0.5, y: 0.5, z: 0 }).then(model => {
                 model.userData.rotationSpeed = 0.002;
            });
        }
        
       
        if(rightCanvasRef.current) {
            rightSceneRef.current = new ThreeScene(rightCanvasRef.current);
            rightSceneRef.current.loadImage('/assests/octo-cupid.webp', { x: 0, y: 0, z: 0 }, 2).then(model => {
                 model.userData.rotationSpeed = 0;
            });
        }
        
        
        if(smallDiceCanvasRef.current) {
            smallDiceSceneRef.current = new ThreeScene(smallDiceCanvasRef.current);
            smallDiceSceneRef.current.loadModel('/assests/dice.glb', { x: 0, y: 0, z: 0 }, 0.6, { x: 0.2, y: 0.8, z: 0.4 }).then(model => {
                 model.userData.rotationSpeed = 0.003;
            });
        }

        return () => {
            if(leftSceneRef.current) leftSceneRef.current.dispose();
            if(rightSceneRef.current) rightSceneRef.current.dispose();
            if(smallDiceSceneRef.current) smallDiceSceneRef.current.dispose();
        }
    }, []);

    useGSAP(() => {
        
        gsap.set(leftCardRef.current, { rotationX: 10, rotationY: 15, transformPerspective: 500 });
        gsap.set(rightCardRef.current, { rotationX: -4, rotationY: 7, transformPerspective: 500 });

        
        ScrollTrigger.create({
            trigger: containerRef.current,
            start: "top top",
            end: "+=800", 
            pin: true,
            scrub: 1,
            animation: gsap.timeline()
                .to(leftCardRef.current, { y: window.innerHeight * 0.3, duration: 1 }, 0)
                .to(rightCardRef.current, { y: window.innerHeight * 0.25, duration: 1 }, 0)
        });
        
        gsap.to(leftCanvasRef.current, {
            rotation: 120,
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "+=800",
                scrub: 1
            }
        });
        
        gsap.to(rightCanvasRef.current, {
            rotation: -5,
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "+=800",
                scrub: 1
            }
        });
        
        
        gsap.to(smallDiceCanvasRef.current, {
            y: 100, 
            rotation: -180,
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "+=800",
                scrub: 1
            }
        });

       
        const textElements = gsap.utils.toArray('.prize-line');
        textElements.forEach(el => {
            const split = new SplitType(el, { types: 'lines, words, chars' });
            
            if (split.chars && split.chars.length > 0) {
                gsap.from(split.chars, {
                    y: 50,
                    opacity: 0,
                    stagger: 0.03,
                    duration: 0.6,
                    ease: "back.out(1.7)",
                    scrollTrigger: {
                        trigger: '#prizes-text',
                        start: "top 85%"
                    }
                });
            }
        });

    }, { scope: containerRef });

    
    const handleMouseMove = (e, cardRef) => {
        const card = cardRef.current;
        if (!card) return;
        const bounds = card.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const centerXRelative = bounds.width / 2;
        const centerYRelative = bounds.height / 2;
        const xPos = mouseX - bounds.left;
        const yPos = mouseY - bounds.top;
        const rotateX = ((yPos - centerYRelative) / centerYRelative) * -20; 
        const rotateY = ((xPos - centerXRelative) / centerXRelative) * 20;
        
        gsap.to(card, {
            rotationX: rotateX,
            rotationY: rotateY,
            scale: 1.05,
            transformPerspective: 500,
            duration: 0.4,
            ease: 'power2.out'
        });
    };

    const handleMouseLeave = (cardRef, isLeft) => {
        if (!cardRef.current) return;
        const initialRotX = isLeft ? 10 : -10;
        const initialRotY = isLeft ? -15 : 15;
        
        gsap.to(cardRef.current, {
            rotationX: initialRotX,
            rotationY: initialRotY,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
        });
    };

    return (
        <div id="prizes" ref={containerRef}>
            <div className="prizes-content">
                <div 
                    className="prize-card left-card" 
                    ref={leftCardRef}
                    onMouseMove={(e) => handleMouseMove(e, leftCardRef)}
                    onMouseLeave={() => handleMouseLeave(leftCardRef, true)}
                >
                    <img src="/assests/wonderland.webp" className="card-bg" alt="Wonderland" />
                    <div className="canvas-container" ref={leftCanvasRef}></div>
                </div>
                

                <div id="prizes-text">  
                    <p className="prize-line">Explore games</p>
                    <p className="prize-line">worth taking </p>
                    <div className="kingdoms-text">
                        <span className="prize-line">a break for.</span>
                        <div className="small-dice-container" ref={smallDiceCanvasRef}></div>
                    </div>
                </div>

                <div 
                    className="prize-card right-card" 
                    ref={rightCardRef}
                    onMouseMove={(e) => handleMouseMove(e, rightCardRef)}
                    onMouseLeave={() => handleMouseLeave(rightCardRef, false)}
                >
                    <img src="/assests/beach.webp" className="card-bg" alt="Beach" />
                    <div className="canvas-container" ref={rightCanvasRef}></div>
                </div>
            </div>
        </div>
    );
};

export default Prizes;
