import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import SplitType from 'split-type';
import ThreeScene from '../utils/ThreeScene';
import '../css/hero.css';

const Hero = () => {
    const canvasRef = useRef(null);
    const sceneInst = useRef(null);
    const textRef = useRef(null);

    useGSAP(() => {
        if (textRef.current) {
            const split = new SplitType(textRef.current, { types: 'lines, words, chars' });
            
            gsap.from(split.chars, {
                y: 50,
                opacity: 0,
                stagger: 0.03,
                duration: 0.6,
                ease: "back.out(1.7)",
                delay: 0.5 
            });
        }
    });

    useEffect(() => {
        if (!canvasRef.current) return;

        
        const threeScene = new ThreeScene(canvasRef.current);
        sceneInst.current = threeScene;

       
        threeScene.camera.fov = 35;
        threeScene.camera.position.z = 20;
        threeScene.camera.updateProjectionMatrix();

       
        const modelConfigs = [
            // { path: '/assests/gem.glb', position: { x: -9, y: -0.9, z: 2 }, scale: 0.45, rotation: { x: 0, y: 0, z: 0 } },
            // { path: '/assests/coin.glb', position: { x: -5.9, y: -2, z: 3 }, scale: 0.5, rotation: { x: 0, y: 0, z: 0 } },
            { path: '/assests/dice.glb', position: { x: -6, y: -3, z: 2 }, scale: 0.45, rotation: { x: 0, y: 0, z: 0 } },
            
           
            { path: '/assests/card-light.glb', position: { x: 4, y: -3, z: 2 }, scale: 0.45, rotation: { x: 0, y: 0, z: 0 } },
            // { path: '/assests/speeder.glb', position: { x: 7.5, y: 0.5, z: 3 }, scale: 0.5, rotation: { x: 0, y: 0, z: 0 } },
            
        
            { type: 'image', path: '/assests/octo-cupid.webp', position: { x: 8, y: 3, z: 1 }, scale: 1.2 }
        ];

        
        const loadModels = async () => {
            try {
                for (let i = 0; i < modelConfigs.length; i++) {
                    const config = modelConfigs[i];
                    if (config.type === 'image') {
                        await threeScene.loadImage(config.path, config.position, config.scale);
                    } else {
                        await threeScene.loadModel(config.path, config.position, config.scale, config.rotation);
                    }
                }
                // console.log(' loaded !');
            } catch (error) {
                console.error('Error loading models:', error);
            }
        };

        loadModels();

        return () => {
            if (sceneInst.current) {
                sceneInst.current.dispose();
            }
        };
    }, []);

    return (
        <div id="hero">
            <div id="hero-canvas" ref={canvasRef}></div>
            <div id="hero-text" ref={textRef}>
                JOIN THE NEW ERA OF GAMING
            </div>
        </div>
    );
};

export default Hero;
