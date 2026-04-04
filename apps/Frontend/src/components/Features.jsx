import React, { useRef } from 'react';
import '../css/features.css';

const Features = () => {
    const headingRef = useRef(null);

    return (
        <div id="features">
            <div id="feature-heading" ref={headingRef}>
                PLAY. FLEX. REPEAT.
            </div>
            <div id="feature-cards">
                <div id="card-1"></div>
                <div id="card-2"></div>
            </div>
        </div>
    );
};

export default Features;
