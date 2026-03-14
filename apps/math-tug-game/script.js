let ans1Correct
let ans2Correct

let p1score = 0
let p2score = 0

let flagPos = 0

let timer = 10
let interval

const flag = document.getElementById("flag")

function startGame(){

p1score = 0
p2score = 0
flagPos = 0

updateScore()
updateFlag()

newRound()

}



function newRound(){

generateQuestions()

startTimer()

}



function generateQuestions(){

let a = rand()
let b = rand()

ans1Correct = a + b
document.getElementById("q1").textContent = a+" + "+b

a = rand()
b = rand()

ans2Correct = a * b
document.getElementById("q2").textContent = a+" × "+b

}



function rand(){
return Math.floor(Math.random()*10)+1
}



function startTimer(){

clearInterval(interval)

timer = 10
document.getElementById("timer").textContent = timer

interval = setInterval(()=>{

timer--

document.getElementById("timer").textContent = timer

if(timer===0){

clearInterval(interval)

newRound()

}

},1000)

}



document.addEventListener("keydown",e=>{

if(e.key==="a") submit1()
if(e.key==="l") submit2()

})



function submit1(){

let val = Number(document.getElementById("ans1").value)

document.getElementById("show1").textContent = val

if(val === ans1Correct){

flagPos -= 40
p1score++

animatePull("p1")

updateFlag()
updateScore()

}

document.getElementById("ans1").value=""

checkWinner()

}



function submit2(){

let val = Number(document.getElementById("ans2").value)

document.getElementById("show2").textContent = val

if(val === ans2Correct){

flagPos += 40
p2score++

animatePull("p2")

updateFlag()
updateScore()

}

document.getElementById("ans2").value=""

checkWinner()

}



function animatePull(player){

let char = player==="p1"
? document.getElementById("p1char")
: document.getElementById("p2char")

char.style.transform="translateX(10px)"

setTimeout(()=>{
char.style.transform="translateX(0px)"
},200)

}



function updateFlag(){

flag.style.left = (240 + flagPos)+"px"

}



function updateScore(){

document.getElementById("p1score").textContent = p1score
document.getElementById("p2score").textContent = p2score

}



function checkWinner(){

if(flagPos <= -200){

document.getElementById("message").textContent =
"🏆 Player 1 Wins!"

clearInterval(interval)

}

if(flagPos >= 200){

document.getElementById("message").textContent =
"🏆 Player 2 Wins!"

clearInterval(interval)

}

}