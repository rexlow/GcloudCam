import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import firebase from 'react-native-firebase';
import { RNCamera } from 'react-native-camera';

const landmarkSize = 2;

const flashModeOrder = {
  off: 'on',
  on: 'auto',
  auto: 'torch',
  torch: 'off',
};

export default class CameraScreen extends React.Component {

  state = {
    flash: 'off',
    autoFocus: 'on',
    type: 'front',
    ratio: '16:9',
    ratios: [],
    photoId: 1,
    photos: [],
    faces: [],
    cameraReady: false,
    recording: false,
    firebaseStorageRef: "gcloudCamImage/image.mp4",
    uploading: false,
    uploaded: false
  };

  getRatios = async function() {
    const ratios = await this.camera.getSupportedRatios();
    return ratios;
  };

  toggleFacing() {
    this.setState({
      type: this.state.type === 'back' ? 'front' : 'back',
    });
  }

  toggleFlash() {
    this.setState({
      flash: flashModeOrder[this.state.flash],
    });
  }

  setRatio(ratio) {
    this.setState({
      ratio,
    });
  }

  onCameraReady = () => this.setState({ cameraReady: true })

  uploadMedia = content => {
    this.setState({ uploading: true, uploaded: false })
    firebase.storage()
      .ref(this.state.firebaseStorageRef)
      .putFile(content)
      .then(uploadedFile => {
        this.setState({ uploading: false, uploaded: true })
      })
      .catch(error => {
        this.setState({ uploading: false, uploaded: false })
      })
  }

  takePicture = async = () => {
    if (this.camera) {
      this.camera.takePictureAsync().then(data => {
        this.uploadMedia(data.uri)
      });
    }
  };

  recordVideo = async = () => {
    this.setState({ recording: true })
    if (this.camera) {
      this.camera.recordAsync({
        quality: "RNCamera.Constants.VideoQuality.720p",
        mute: true
      })
      .then(data => this.uploadMedia(data.uri))
      .catch(error => console.log(error))
    }
  }

  stopRecord = async = () => {
    if (this.camera) {
      this.camera.stopRecording()
      this.setState({ recording: false })
    }
  }

  onFacesDetected = ({ faces }) => this.setState({ faces });
  onFaceDetectionError = state => console.warn('Faces detection error:', state);

  renderFace({ bounds, faceID, rollAngle, yawAngle }) {
    return (
      <View
        key={faceID}
        transform={[
          { perspective: 600 },
          { rotateZ: `${rollAngle.toFixed(0)}deg` },
          { rotateY: `${yawAngle.toFixed(0)}deg` },
        ]}
        style={[
          styles.face,
          {
            ...bounds.size,
            left: bounds.origin.x,
            top: bounds.origin.y,
          },
        ]}
      >
        <Text style={styles.faceText}>ID: {faceID}</Text>
        <Text style={styles.faceText}>rollAngle: {rollAngle.toFixed(0)}</Text>
        <Text style={styles.faceText}>yawAngle: {yawAngle.toFixed(0)}</Text>
      </View>
    );
  }

  renderLandmarksOfFace(face) {
    const renderLandmark = position =>
      position && (
        <View
          style={[
            styles.landmark,
            {
              left: position.x - landmarkSize / 2,
              top: position.y - landmarkSize / 2,
            },
          ]}
        />
      );
    return (
      <View key={`landmarks-${face.faceID}`}>
        {renderLandmark(face.leftEyePosition)}
        {renderLandmark(face.rightEyePosition)}
        {renderLandmark(face.leftEarPosition)}
        {renderLandmark(face.rightEarPosition)}
        {renderLandmark(face.leftCheekPosition)}
        {renderLandmark(face.rightCheekPosition)}
        {renderLandmark(face.leftMouthPosition)}
        {renderLandmark(face.mouthPosition)}
        {renderLandmark(face.rightMouthPosition)}
        {renderLandmark(face.noseBasePosition)}
        {renderLandmark(face.bottomMouthPosition)}
      </View>
    );
  }

  renderFaces() {
    return (
      <View style={styles.facesContainer} pointerEvents="none">
        {this.state.faces.map(this.renderFace)}
      </View>
    );
  }

  renderLandmarks() {
    return (
      <View style={styles.facesContainer} pointerEvents="none">
        {this.state.faces.map(this.renderLandmarksOfFace)}
      </View>
    );
  }

  renderCamera() {
    return (
      <RNCamera
        ref={ref => {
          this.camera = ref;
        }}
        style={{
          flex: 1,
        }}
        type={this.state.type}
        flashMode={this.state.flash}
        autoFocus={this.state.autoFocus}
        ratio={this.state.ratio}
        captureQuality={"high"}
        onCameraReady={this.onCameraReady}
        faceDetectionLandmarks={RNCamera.Constants.FaceDetection.Landmarks.all}
        onFacesDetected={this.onFacesDetected}
        onFaceDetectionError={this.onFaceDetectionError}
        permissionDialogTitle={'Permission to use camera'}
        permissionDialogMessage={'We need your permission to use your camera phone'}
      >
        <TouchableOpacity
          style={[styles.flipButton]}
          onPress={this.state.recording === false ? this.recordVideo : this.stopRecord}>
          <Text style={styles.flipText}>{this.state.recording === false ? "START" : "STOP"}</Text>
        </TouchableOpacity>
        {this.renderFaces()}
        {this.renderLandmarks()}
      </RNCamera>
    );
  }

  render() {
    const { container, numFacesContainer, numFacesText, testShit } = styles;
    return (
      <View style={[container]}>
        <View style={[numFacesContainer]}>
          <Text style={numFacesText}>Number of faces detected: {this.state.faces.length}</Text>
          <Text style={numFacesText}>{this.state.uploading === false && this.state.uploaded === true ? "OK" : ""}</Text>
        </View>
        {this.renderCamera()}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  testShit: {
    borderColor: 'red',
    borderWidth: 2
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  numFacesContainer: {
    height: 58,
    backgroundColor: "#2962FF",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 14
  },
  numFacesText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#FFF"
  },
  flipButton: {
    height: 40,
    width: 120,
    marginHorizontal: 2,
    marginBottom: 10,
    marginTop: 20,
    borderRadius: 8,
    borderColor: 'white',
    borderWidth: 1,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#2962FF",
    position: 'absolute',
    alignSelf: 'center',
    bottom: 10
  },
  flipText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold'
  },
  facesContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },
  face: {
    padding: 10,
    borderWidth: 2,
    borderRadius: 2,
    position: 'absolute',
    borderColor: '#FFD700',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  landmark: {
    width: landmarkSize,
    height: landmarkSize,
    position: 'absolute',
    backgroundColor: 'red',
  },
  faceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
  },
});