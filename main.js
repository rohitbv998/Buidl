// import { createAlchemyWeb3 } from "./node_modules/alchemy-web3/dist/alchemyWeb3.min.js";
const web3 = AlchemyWeb3.createAlchemyWeb3("https://eth-ropsten.alchemyapi.io/v2/dy9l2Ug8FVQKAky73fEaMWi_ZddacMCB");

// const Web3 = require("web3")
// const web3 = new Web3('https://ropsten.infura.io/v3/05a7c831d0954c37ad97cec9dca26715');

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )

const renderer = new THREE.WebGLRenderer()
renderer.setSize( window.innerWidth, window.innerHeight )
document.body.appendChild( renderer.domElement )

const light = new THREE.AmbientLight( 0xffffff )
scene.add( light )

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.3 );
directionalLight.castShadow = true
scene.add( directionalLight )
directionalLight.position.set( 0, 1, 1 )

camera.position.z = 5
renderer.setClearColor( 0xB7C3F3, 1 )

const loader = new THREE.GLTFLoader()
let doll

const start_position = 6
const end_position = -start_position

const text = document.querySelector('.text')

let DEAD_PLAYERS = 0
let SAFE_PLAYERS = 0

const startBtn = document.querySelector('.start-btn')

//musics
const bgMusic = new Audio('./music/bg.mp3')
bgMusic.loop = true
const winMusic = new Audio('./music/win.mp3')
const loseMusic = new Audio('./music/lose.mp3')

loader.load( './model/scene.gltf', function ( gltf ){
    scene.add( gltf.scene )
    doll = gltf.scene
    gltf.scene.position.set(0,-1, 0)
    gltf.scene.scale.set(0.4, 0.4, 0.4)
    startBtn.innerText = "Connect"
})

//Metamask connection
window.userWalletAddress = null
const account = null

function toggleButton() {
    if (!window.ethereum) {
    ethereum.enable();
    startBtn.innerText = 'MetaMask is not installed'
    startBtn.classList.remove('bg-purple-500', 'text-white')
    startBtn.classList.add('bg-gray-500', 'text-gray-100', 'cursor-not-allowed')
    return false
    }

    startBtn.addEventListener('click', loginWithMetaMask)
}

async function loginWithMetaMask() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    .catch((e) => {
        console.error(e.message)
        return
    })
    if (!accounts) { return }

    window.userWalletAddress = accounts[0]
//   userWallet.innerText = window.userWalletAddress
    startBtn.innerText = 'start'

    startBtn.removeEventListener('click', loginWithMetaMask)
    setTimeout(() => {
    startBtn.addEventListener('click', startGame)
    }, 200)
}

function startGame(){
    if(startBtn.innerText == "START"){
        console.log(window.userWalletAddress)
        init()
        document.querySelector('.modal').style.display = "none"
    }
}

// function play() {
//     account = window.userWalletAddress 
//     // userWallet.innerText = ''
//     // loginButton.innerText = 'Sign in with MetaMask'

//     startBtn.removeEventListener('click', signOutOfMetaMask)
//     setTimeout(() => {
//     startBtn.addEventListener('click', startGame)
//     }, 200)
// }

window.addEventListener('DOMContentLoaded', () => {
    toggleButton()
});

function lookBackward(){
    gsap.to(doll.rotation, {duration: .45, y: -3.15})
    setTimeout(() => dallFacingBack = true, 150)
}
function lookForward(){
    gsap.to(doll.rotation, {duration: .45, y: 0})
    setTimeout(() => dallFacingBack = false, 450)
}

function createCube(size, posX, rotY = 0, color = 0xfbc851){
    const geometry = new THREE.BoxGeometry( size.w, size.h, size.d )
    const material = new THREE.MeshBasicMaterial( { color } )
    const cube = new THREE.Mesh( geometry, material )
    cube.position.set(posX, 0, 0)
    cube.rotation.y = rotY
    scene.add( cube )
    return cube
}

//Creating runway
createCube({w: start_position * 2 + .21, h: 1.5, d: 1}, 0, 0, 0xe5a716).position.z = -1
createCube({w: .2, h: 1.5, d: 1}, start_position, -.4)
createCube({w: .2, h: 1.5, d: 1}, end_position, .4)


class Player {
    constructor(name = "Player", radius = .25, posY = 0, color = 0xffffff){
        const geometry = new THREE.SphereGeometry( radius, 100, 100 )
        const material = new THREE.MeshBasicMaterial( { color } )
        const player = new THREE.Mesh( geometry, material )
        scene.add( player )
        player.position.x = start_position - .4
        player.position.z = 1
        player.position.y = posY
        this.player = player
        this.playerInfo = {
            positionX: start_position - .4,
            velocity: 0,
            name,
            isDead: false
        }
    }

    run(){
        if(this.playerInfo.isDead) return
        this.playerInfo.velocity = .03
    }

    stop(){
        gsap.to(this.playerInfo, { duration: .1, velocity: 0 })
    }

    check(){
        if(this.playerInfo.isDead) return
        if(!dallFacingBack && this.playerInfo.velocity > 0){
            text.innerText = this.playerInfo.name + " lost!!!"
            this.playerInfo.isDead = true
            this.stop()
            DEAD_PLAYERS++
            loseMusic.play()
            if(DEAD_PLAYERS == players.length){
                text.innerText = "Everyone lost!!!"
                gameStat = "ended"
            }
            if(DEAD_PLAYERS + SAFE_PLAYERS == players.length){
                gameStat = "ended"
            }
        }
        if(this.playerInfo.positionX < end_position + .7){
            text.innerText = this.playerInfo.name + " is safe!!!"
            this.playerInfo.isDead = true
            this.stop()
            SAFE_PLAYERS++
            winMusic.play()
            mintNFT("https://gateway.pinata.cloud/ipfs/QmSw5amDNUPs3umY8v6Fe74UwHRH7SdTo4ZmY2LfB2rbq6");
            if(SAFE_PLAYERS == players.length){
                text.innerText = "Everyone is safe!!!"
                gameStat = "ended"
            }
            if(DEAD_PLAYERS + SAFE_PLAYERS == players.length){
                gameStat = "ended"
            }
        }
    }

    update(){
        this.check()
        this.playerInfo.positionX -= this.playerInfo.velocity
        this.player.position.x = this.playerInfo.positionX
    }
}

async function delay(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
}

const player1 = new Player("Player 1", .25, 0, 0xD1FFC6)
// const player2 = new Player("Player 2", .25, -.3, 0xFFCFD2)

const players = [
    {
        player: player1,
        key: "ArrowUp",
        name: "Player 1"
    }
    // {
    //     player: player2,
    //     key: "w",
    //     name: "Player 2"
    // }
]

const TIME_LIMIT = 15
async function init(){
    await delay(500)
    text.innerText = "Starting in 3"
    await delay(500)
    text.innerText = "Starting in 2"
    await delay(500)
    text.innerText = "Starting in 1"
    lookBackward()
    await delay(500)
    text.innerText = "Gooo!!!"
    bgMusic.play()
    start()
}

let gameStat = "loading"

function start(){
    gameStat = "started"
    const progressBar = createCube({w: 8, h: .1, d: 1}, 0, 0, 0xebaa12)
    progressBar.position.y = 3.35
    gsap.to(progressBar.scale, {duration: TIME_LIMIT, x: 0, ease: "none"})
    setTimeout(() => {
        if(gameStat != "ended"){
            text.innerText = "Time Out!!!"
            loseMusic.play()
            gameStat = "ended"
        }
    }, TIME_LIMIT * 1000)
    startDall()
}

let dallFacingBack = true
async function startDall(){
   lookBackward()
   await delay((Math.random() * 1500) + 1500)
   lookForward()
   await delay((Math.random() * 750) + 750)
   startDall()
}


// startBtn.addEventListener('click', startGame)




function animate(){
    renderer.render( scene, camera )
    players.map(player => player.player.update())
    if(gameStat == "ended") return
    requestAnimationFrame( animate )
}
animate()

window.addEventListener( "keydown", function(e){
    if(gameStat != "started") return
    let p = players.find(player => player.key == e.key)
    if(p){
        p.player.run()
    }
})
window.addEventListener( "keyup", function(e){
    let p = players.find(player => player.key == e.key)
    if(p){
        p.player.stop()
    }
})

window.addEventListener( 'resize', onWindowResize, false )
function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize( window.innerWidth, window.innerHeight )
}

var abi = null;
//Web3 Code
// const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
// const web3 = createAlchemyWeb3("https://eth-ropsten.alchemyapi.io/v2/dy9l2Ug8FVQKAky73fEaMWi_ZddacMCB");

// import { abi } from "../artifacts/contracts/MyNFT.sol/MyNFT.json";

abi = [{"inputs": [],"stateMutability": "nonpayable","type": "constructor"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "owner","type": "address"},{"indexed": true,"internalType": "address","name": "approved","type": "address"},{"indexed": true,"internalType": "uint256","name": "tokenId","type": "uint256"}],"name": "Approval","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "owner","type": "address"},{"indexed": true,"internalType": "address","name": "operator","type": "address"},{"indexed": false,"internalType": "bool","name": "approved","type": "bool"}],"name": "ApprovalForAll","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "previousOwner","type": "address"},{"indexed": true,"internalType": "address","name": "newOwner","type": "address"}],"name": "OwnershipTransferred","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "from","type": "address"},{"indexed": true,"internalType": "address","name": "to","type": "address"},{"indexed": true,"internalType": "uint256","name": "tokenId","type": "uint256"}],"name": "Transfer","type": "event"},{"inputs": [{"internalType": "address","name": "to","type": "address"},{"internalType": "uint256","name": "tokenId","type": "uint256"}],"name": "approve","outputs": [],"stateMutability": "nonpayable","type": "function"},{"inputs": [{"internalType": "address","name": "owner","type": "address"}],"name": "balanceOf","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},{"inputs": [],"name": "baseURI","outputs": [{"internalType": "string","name": "","type": "string"}],"stateMutability": "view","type": "function"},{"inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],"name": "getApproved","outputs": [{"internalType": "address","name": "","type": "address"}],"stateMutability": "view","type": "function"},{"inputs": [{"internalType": "address","name": "owner","type": "address"},{"internalType": "address","name": "operator","type": "address"}],"name": "isApprovedForAll","outputs": [{"internalType": "bool","name": "","type": "bool"}],"stateMutability": "view","type": "function"},{"inputs": [{"internalType": "address","name": "recipient","type": "address"},{"internalType": "string","name": "tokenURI","type": "string"}],"name": "mintNFT","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "nonpayable","type": "function"},{"inputs": [],"name": "name","outputs": [{"internalType": "string","name": "","type": "string"}],"stateMutability": "view","type": "function"},{"inputs": [],"name": "owner","outputs": [{"internalType": "address","name": "","type": "address"}],"stateMutability": "view","type": "function"},{"inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],"name": "ownerOf","outputs": [{"internalType": "address","name": "","type": "address"}],"stateMutability": "view","type": "function"},{"inputs": [],"name": "renounceOwnership","outputs": [],"stateMutability": "nonpayable","type": "function"},{"inputs": [{"internalType": "address","name": "from","type": "address"},{"internalType": "address","name": "to","type": "address"},{"internalType": "uint256","name": "tokenId","type": "uint256"}],"name": "safeTransferFrom","outputs": [],"stateMutability": "nonpayable","type": "function"},{"inputs": [{"internalType": "address","name": "from","type": "address"},{"internalType": "address","name": "to","type": "address"},{"internalType": "uint256","name": "tokenId","type": "uint256"},{"internalType": "bytes","name": "_data","type": "bytes"}],"name": "safeTransferFrom","outputs": [],"stateMutability": "nonpayable","type": "function"},{"inputs": [{"internalType": "address","name": "operator","type": "address"},{"internalType": "bool","name": "approved","type": "bool"}],"name": "setApprovalForAll","outputs": [],"stateMutability": "nonpayable","type": "function"},{"inputs": [{"internalType": "bytes4","name": "interfaceId","type": "bytes4"}],"name": "supportsInterface","outputs": [{"internalType": "bool","name": "","type": "bool"}],"stateMutability": "view","type": "function"},{"inputs": [],"name": "symbol","outputs": [{"internalType": "string","name": "","type": "string"}],"stateMutability": "view","type": "function"},{"inputs": [{"internalType": "uint256","name": "index","type": "uint256"}],"name": "tokenByIndex","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},{"inputs": [{"internalType": "address","name": "owner","type": "address"},{"internalType": "uint256","name": "index","type": "uint256"}],"name": "tokenOfOwnerByIndex","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},{"inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],"name": "tokenURI","outputs": [{"internalType": "string","name": "","type": "string"}],"stateMutability": "view","type": "function"},{"inputs": [],"name": "totalSupply","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},{"inputs": [{"internalType": "address","name": "from","type": "address"},{"internalType": "address","name": "to","type": "address"},{"internalType": "uint256","name": "tokenId","type": "uint256"}],"name": "transferFrom","outputs": [],"stateMutability": "nonpayable","type": "function"},{"inputs": [{"internalType": "address","name": "newOwner","type": "address"}],"name": "transferOwnership","outputs": [],"stateMutability": "nonpayable","type": "function"}];

const contractAddress = "0x2C9E1571E5Ec0cC5434435E7F0C3f50A4c5E10F7";
const nftContract = new web3.eth.Contract(abi, contractAddress);

async function mintNFT(tokenURI) {
    const nonce = await web3.eth.getTransactionCount(window.userWalletAddress, 'latest'); //get latest nonce
  
    //the transaction
    // const tx = {
    //   'from': window.userWalletAddress,
    //   'to': contractAddress,
    //   'nonce': nonce,
    //   'gas': 500000,
    //   'maxPriorityFeePerGas': 1999999987,
    //   'data': nftContract.methods.mintNFT(window.userWalletAddress, tokenURI).encodeABI()
    // };

    // const signedTx = await web3.eth.accounts.signTransaction(tx, "660c4e9cbbc26a49ff2e257f1c54dd48d770428bd8ffb45b3af4127ccb46877f");
    // const transactionReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  
    // console.log(`Transaction receipt: ${JSON.stringify(transactionReceipt)}`);

    nftContract.methods.mintNFT(window.userWalletAddress, tokenURI).send({
        from: window.userWalletAddress,
        gas: 500000,
        gasPrice: '20000000000'
    })
  }