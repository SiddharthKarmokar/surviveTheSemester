const board = document.getElementById("game-board");
const message = document.getElementById("message");
const timerText = document.getElementById("timer");

let size = 6;
let difficulty = "medium";

let solution = [];
let puzzle = [];
let current = [];

let timer = 0;
let timerInterval;

let timerStarted = false;
let solutionShown = false;


/* ---------- EVENTS ---------- */

document.getElementById("size-select").addEventListener("change",e=>{
size = parseInt(e.target.value);
});

document.getElementById("difficulty-select").addEventListener("change",e=>{
difficulty = e.target.value;
});

document.getElementById("new-game").addEventListener("click",startGame);
document.getElementById("check-btn").addEventListener("click",checkBoard);
document.getElementById("reset-btn").addEventListener("click",resetGame);
document.getElementById("show-solution").addEventListener("click",showSolution);
document.getElementById("rules-btn").addEventListener("click",toggleRules);


/* ---------- RULES ---------- */

function toggleRules(){

let rules=document.getElementById("rules");

if(rules.style.display==="block")
rules.style.display="none";
else
rules.style.display="block";

}


/* ---------- TIMER ---------- */

function startTimer(){

timer = 0;

timerText.textContent = timer;

timerInterval = setInterval(()=>{
timer++;
timerText.textContent = timer;
},1000);

}


/* ---------- START GAME ---------- */

function startGame(){

solution = createSolution(size);

puzzle = createPuzzle(solution);

current = JSON.parse(JSON.stringify(puzzle));

drawBoard();

clearInterval(timerInterval);
timer = 0;
timerText.textContent = timer;

timerStarted = false;
solutionShown = false;

message.textContent="";

}


/* ---------- DRAW BOARD ---------- */

function drawBoard(){

board.innerHTML="";

board.style.gridTemplateColumns=`repeat(${size},50px)`;

for(let r=0;r<size;r++){

for(let c=0;c<size;c++){

let cell=document.createElement("div");
cell.classList.add("cell");

if(puzzle[r][c] !== ""){

cell.textContent=puzzle[r][c];
cell.classList.add("fixed");

}

else{

cell.addEventListener("click",()=>{
changeValue(r,c,cell);
});

}

board.appendChild(cell);

}

}

}


/* ---------- CHANGE CELL ---------- */

function changeValue(r,c,cell){

if(solutionShown) return;

if(!timerStarted){
startTimer();
timerStarted = true;
}

if(current[r][c]==="") current[r][c]=0;
else if(current[r][c]===0) current[r][c]=1;
else current[r][c]="";

cell.textContent=current[r][c];

}


/* ---------- RESET ---------- */

function resetGame(){

current = JSON.parse(JSON.stringify(puzzle));

drawBoard();

clearInterval(timerInterval);

timer=0;
timerText.textContent=timer;

timerStarted=false;

message.textContent="";

}


/* ---------- SHOW SOLUTION ---------- */

function showSolution(){

solutionShown = true;

clearInterval(timerInterval);

current = JSON.parse(JSON.stringify(solution));
puzzle = JSON.parse(JSON.stringify(solution));

drawBoard();

message.textContent =
"Solution displayed. Click 'New Game' to play again.";

}


/* ---------- CHECK SOLUTION ---------- */

function checkBoard(){

if(solutionShown){
message.textContent =
"Solution was already shown. Start a new game.";
return;
}

if(isValid(current)){

clearInterval(timerInterval);

message.textContent =
"🎉 You solved the puzzle in "+timer+" seconds!";

}

else{

message.textContent =
"❌ Incorrect solution.";

}

}


/* ---------- VALIDATION ---------- */

function isValid(boardData){

for(let i=0;i<size;i++){

let row = boardData[i];
let col = boardData.map(r=>r[i]);

if(!validLine(row) || !validLine(col))
return false;

}

if(!unique(boardData)) return false;

let columns=[];

for(let i=0;i<size;i++){
columns.push(boardData.map(r=>r[i]));
}

if(!unique(columns)) return false;

return true;

}


function validLine(arr){

if(arr.includes("")) return false;

let zeros = arr.filter(v=>v===0).length;
let ones = arr.filter(v=>v===1).length;

if(zeros!==size/2 || ones!==size/2)
return false;

for(let i=0;i<size-2;i++){

if(arr[i]===arr[i+1] && arr[i]===arr[i+2])
return false;

}

return true;

}


function unique(lines){

let set=new Set();

for(let line of lines){

let str=line.join("");

if(set.has(str)) return false;

set.add(str);

}

return true;

}


/* ---------- CREATE SOLUTION ---------- */

function createSolution(n){

while(true){

let board=Array.from({length:n},()=>
Array.from({length:n},()=>Math.random()>0.5?1:0)
);

if(isValid(board)) return board;

}

}


/* ---------- CREATE PUZZLE ---------- */

function createPuzzle(sol){

let puzzle = JSON.parse(JSON.stringify(sol));

let remove;

if(difficulty==="easy")
remove=size*size*0.3;
else if(difficulty==="medium")
remove=size*size*0.5;
else
remove=size*size*0.65;

let removed=0;

while(removed<remove){

let r=Math.floor(Math.random()*size);
let c=Math.floor(Math.random()*size);

if(puzzle[r][c] !== ""){

puzzle[r][c]="";
removed++;

}

}

return puzzle;

}


/* ---------- START ---------- */

startGame();