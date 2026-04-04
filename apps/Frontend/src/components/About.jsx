import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SplitType from 'split-type';
import '../css/about.css';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const frameRef = useRef(null);
    const containerRef = useRef(null);
    const titleRef = useRef(null);

    useGSAP(() => {
        if (titleRef.current) {
            const split = new SplitType(titleRef.current, { types: 'lines, words, chars' });

            if(split.chars && split.chars.length > 0) {
                gsap.from(split.chars, {
                    y: 50,
                    opacity: 0,
                    stagger: 0.03,
                    duration: 0.6,
                    ease: "back.out(1.7)",
                    scrollTrigger: {
                        trigger: titleRef.current,
                        start: "top 85%"
                    }
                });
            }
        }
    });

    useEffect(() => {
        const frame = frameRef.current;
        const container = containerRef.current;

        if (!frame || !container) return;

        let bounds;
        
        function updateBounds() {
            bounds = container.getBoundingClientRect();
        }
        
        
        window.addEventListener('resize', updateBounds);
        window.addEventListener('scroll', updateBounds);
        updateBounds();

        const handleMouseMove = (e) => {
            if (!bounds) return;
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            const centerXRelative = bounds.width / 2;
            const centerYRelative = bounds.height / 2;
            
            const xPos = mouseX - bounds.left;
            const yPos = mouseY - bounds.top;

            const rotateX = ((yPos - centerYRelative) / centerYRelative) * -10; 
            const rotateY = ((xPos - centerXRelative) / centerXRelative) * 10;

            frame.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        };

        const handleMouseLeave = () => {
            frame.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)';
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('resize', updateBounds);
            window.removeEventListener('scroll', updateBounds);
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div id="about">
            <div className="about-container" ref={containerRef}>
                <div className="about-title" ref={titleRef}>
                    Built for<br />students who game<br /> <b>between deadlines.</b>
                </div>

                <div className="story-img-container">
                    <div className="story-img-mask">
                        <div className="story-img-content" ref={frameRef}>
                            <img src="/banner.jpg" alt="Wonderland Image" className="object-contain" />
                        </div>
                    </div>
                </div>
                
                
                <svg className="svg-filter" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <filter id="flt_tag">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="flt_tag" />
                            <feComposite in="SourceGraphic" in2="flt_tag" operator="atop" />
                        </filter>
                    </defs>
                </svg>
            </div>
        </div>
    );
};

export default About;
