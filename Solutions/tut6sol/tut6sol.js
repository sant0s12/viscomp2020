// tut6sol for visual computing 2020
// FKM, originally authored by JMB

const vertShaderSource = `
    attribute vec3 aVertexPosition;
    attribute vec4 aVertexColor;
    varying lowp vec4 vColor; 
    void main(void) {
        gl_Position = vec4(aVertexPosition, 1.);
        vColor = aVertexColor;     
    }
`;

const fragShaderSource = `
    precision highp float;
    uniform vec3 uForegroundColor;
    varying lowp vec4 vColor; 
    void main(void) {
       gl_FragColor = vColor;
    }
`;

////////////////////////////////////////////////////////////////////////////////

// NOTE: These are your globals.

var globalTime = 0.;

var canvas = document.getElementById('canvas'); 
var gl = canvas.getContext('webgl', { alpha:false}); 

////////////////////////////////////////////////////////////////////////////////

function main() {

    var shaderProgram = setupShaderProgram();
    loop(); 

    function loop() { 
        window.requestAnimationFrame(loop); // TODO: Look up the docs for this too.
        process();
        draw();
    }; 

    function process() {
        globalTime += .01; // NOTE: A variable like this is really useful for debugging.
    };

    function draw() { 
        getReadyToDraw();
        drawPolygon(256);
    }; 

    function getReadyToDraw() { 
        gl.clearColor(0., 0., 0., 1.); // NOTE: This is the background color.
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };

    function drawPolygon(N) { 
        // let N = Math.floor(3 + (.5 - .5*Math.cos(globalTime))*13);
        

        let theta = []; 
        for (i = 0; i < N; i++) { 
            theta.push(i/N*2.*Math.PI + globalTime);
        }
        
        let O = vec2.fromValues(0., 0.);
        let perim = [];
        for (i = 0; i < N; i++) { 
            let p = vec2.fromValues(Math.cos(theta[i]), Math.sin(theta[i]));
            let angle = Math.atan2(p[1], p[0]);
            if (angle > Math.PI) { angle -= Math.PI; }
            vec2.scale(p, p, .7 + .2*Math.sin(2.*globalTime)*Math.sin(7.*angle)); // change first sin to tan for weird effect
            perim.push(p);
        }

        let points = [];
        for (i = 0; i < N; i++) { 
            points.push(O);
            points.push(perim[i]);
            points.push(perim[(i + 1) % N]);
        } 

        let vertexData = concatArrayOfFloat32Arrays(points);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

        const aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexPosition);


        let colors = [];
        for (i = 0; i < N; i++) { 
            let col_center = vec4.fromValues(1., 1., 1., 1.);
            let col_i      = vec4.fromValues(0., 0., 0., 1.);
            let col_ip1    = vec4.fromValues(0., 0., 0., 1.);
            let tau = Math.acos(-1.)*2.; 
            let c = vec3.fromValues(0, 2, 1);
            for (j = 0; j < 3; ++j) { 
                col_center[j] = Math.sqrt(Math.sin(                globalTime + c[j]/3.*tau)*.5+.5);
                col_i[j]      = Math.sqrt(Math.sin(  i           + globalTime + c[j]/3.*tau)*.5+.5);
                col_ip1[j]    = Math.sqrt(Math.sin(((i + 1) % N) + globalTime + c[j]/3.*tau)*.5+.5);
            } 
            colors.push(col_center);
            colors.push(col_i);
            colors.push(col_ip1);
        } 

        let colorData = concatArrayOfFloat32Arrays(colors);
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
        // --
        const aVertexColor = gl.getAttribLocation(shaderProgram, "aVertexColor");
        gl.vertexAttribPointer( aVertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexColor);

        gl.drawArrays(gl.TRIANGLES, 0, points.length); 
    };

    function setupShaderProgram() { 
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vertShaderSource);
        gl.compileShader(vertShader);
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(vertShader));
            return;
        }

        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fragShaderSource);
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(fragShader));
            return;
        }

        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram, fragShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        return shaderProgram;
    };
};

////////////////////////////////////////////////////////////////////////////////

function concatArrayOfFloat32Arrays(bufs){
    // https://stackoverflow.com/questions/4554252/typed-arrays-in-gecko-2-float32array-concatenation-and-expansion 
    function sum(a){ return a.reduce(function(a,b){return a+b;},0); } 
    var lens=bufs.map(function(a){return a.length;});
    var aout=new Float32Array(sum(lens));
    for (var i=0; i<bufs.length; ++i) {
        var start=sum(lens.slice(0,i));
        aout.set(bufs[i],start); // copy bufs[i] to aout at start position
    }
    return aout;
}

