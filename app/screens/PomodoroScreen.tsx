import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function PomodoroScreen() {
  const [timer, setTimer] = useState(1500); // Default Pomodoro Time: 25 minutes (1500 seconds)
  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Convert seconds to MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Start or stop the timer
  const toggleTimer = () => {
    if (isRunning) {
      clearInterval(intervalId);
      setIsRunning(false);
    } else {
      const id = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 0) {
            clearInterval(id);
            setIsRunning(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
      setIntervalId(id);
      setIsRunning(true);
    }
  };

  // Reset the timer to the default Pomodoro time (25 minutes)
  const resetTimer = () => {
    if (isRunning) {
      clearInterval(intervalId);
      setIsRunning(false);
    }
    setTimer(1500); // Reset to 25 minutes (1500 seconds)
  };

  // Handle scroll events to add or subtract time
  const handleScroll = (event) => {
    const contentOffsetY = event.nativeEvent.contentOffset.y;
    if (contentOffsetY > 0) {
      // Scroll Down: Decrease Time by 10 minutes (600 seconds)
      if (!isScrolling) {
        setIsScrolling(true);
        setTimer((prevTime) => Math.max(prevTime - 600, 0)); // Prevent going below 0 seconds
      }
    } else {
      // Scroll Up: Add Time by 10 minutes (600 seconds)
      if (!isScrolling) {
        setIsScrolling(true);
        setTimer((prevTime) => prevTime + 600);
      }
    }
  };

  const handleScrollEnd = () => {
    setIsScrolling(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16} // For smooth scrolling
      >
        <Text style={styles.timer}>{formatTime(timer)}</Text>
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={toggleTimer}>
        <Text style={styles.buttonText}>{isRunning ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  scrollContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
    marginBottom: 20,
  },
  timer: {
    fontSize: 80,
    fontWeight: 'bold',
    color: 'white',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    width: 200,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButton: {
    backgroundColor: '#FF6347', // Tomato color for reset
    padding: 15,
    borderRadius: 10,
    width: 200,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
