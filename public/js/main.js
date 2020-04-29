
//Creating elements
let $divSelectRoom = document.getElementById('selectRoom')
let $divConsultingRoom = document.getElementById('consultingRoom')
let $inputRoomNumber = document.getElementById('roomField')
let $btnGoRoom = document.getElementById('roomButton')
let $localVideo = document.getElementById('localVideo')
let $remoteVideo =document.getElementById('remoteVideo')

//declaring variables
let roomNumber, localStream, remoteStream, rtcPeerConnection
var isCaller

//Configuring ICE server
const iceServers = {
    'iceServer':[
        {'urls':'stun:stun.services.mozilla.com'},
        {'urls':'stun:stun.l.google.com:19302'},
        {'urls':'stun:stun1.l.google.com:19302'},
        {'urls':'stun:stun2.l.google.com:19302'},
        {'urls':'stun:stun3.l.google.com:19302'},
        {'urls':'stun:stun4.l.google.com:19302'},
        {'urls':'stun:stun.softjoys.com'},
        {'urls':'stun:stun.voipstunt.com'},
        {
            'urls': 'turn:192.158.29.39:3478?transport=udp',
            'username': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            'credentials': '28224511:1379330808'
        },
        {
            'urls': 'turn:192.158.29.39:3478?transport=tcp',
            'username': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            'credentials': '28224511:1379330808'
        },
        {
            'url': 'turn:turn.bistri.com:80',
            'credential': 'homeo',
            'username': 'homeo'
        },
        {
            'url': 'turn:turn.anyfirewall.com:443?transport=tcp',
            'credential': 'webrtc',
            'username': 'webrtc'
        }
    ]
}

//Configuring constraints
var streamConstraints = {
    audio:true,
    video:true
}

var socket = io()

$btnGoRoom.onclick=()=>{
    if($inputRoomNumber.value === ''){
        alert('please type a room name')
    }else{
        roomNumber = $inputRoomNumber.value
        console.log(roomNumber)
        socket.emit('create or join',roomNumber)
        $divSelectRoom.style = "display: none"
        $divConsultingRoom.style="display: block"
    }

}

socket.on('created',(room)=>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
        .then((stream)=>{
            localStream = stream
            $localVideo.srcObject = stream
            isCaller = true
        })
        .catch((error)=>{
            console.log('Cannot get user media! ', error)
        })
})

socket.on('joined',(room)=>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
        .then((stream)=>{
            localStream = stream
            $localVideo.srcObject = stream
            socket.emit('ready',roomNumber)
        })
        .catch((error)=>{
            console.log('Cannot get user media!')
        })
})

socket.on('candidate', (event)=>{
    const candidate = new RTCIceCandidate({
        sdpMLineIndex:event.label,
        candidate:event.candidate
    })
    console.log('Received candidate ', candidate)
    rtcPeerConnection.addIceCandidate(candidate)
})

socket.on('ready',()=>{
    if(isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0],localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1],localStream)
        rtcPeerConnection.createOffer()
            .then((sessionDescription)=>{
                console.log('Sending offer ', sessionDescription)
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('offer',{
                    type:'offer',
                    sdp:sessionDescription,
                    room:roomNumber
                })
            })
            .catch((error)=>{
                console.log(error)
            })

    }

})

socket.on('offer',(event)=>{
    if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0],localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1],localStream)
        console.log('received offer ', event)
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        rtcPeerConnection.createAnswer()
            .then((sessionDescription)=>{
                console.log('Sending the answer ', sessionDescription)
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('answer',{
                    type:'answer',
                    sdp:sessionDescription,
                    room:roomNumber
                })
            })
            .catch((error)=>{
                console.log(error)
            })

    }

})

socket.on('answer', (event)=>{
    console.log('received answer ', event)
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

function onIceCandidate(event){
    if(event.candidate){
        console.log('sending ice candidate ', event.candidate)
        socket.emit('candidate',{
            type:'candidate',
            label:event.candidate.sdpMLineIndex,
            id:event.candidate.sdpMid,
            candidate:event.candidate.candidate,
            room:roomNumber

        })
    }
}

function onAddStream(event){
    $remoteVideo.srcObject = event.streams[0]
    remoteStream = event.streams[0]
}



