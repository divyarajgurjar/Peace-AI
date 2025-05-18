import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import PomodoroScreen from './screens/PomodoroScreen';
import TasksScreen from './screens/TasksScreen';

const ngrokURL = "https://e168-2401-4900-1c09-bcc2-31c0-37c5-1571-f3a7.ngrok-free.app";

export default function App() {
  const [view, setView] = useState<'qa' | 'pomodoro' | 'tasks'>('qa');

  const [pdfUri, setPdfUri] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [pdfId, setPdfId] = useState(null);

  const pickPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPdfUri(asset.uri);
      setPdfName(asset.name);
      setPdfUploaded(false);
      setQuestion('');
      setAnswer(null);
    }
  };

  const uploadPDF = async () => {
    try {
      if (!pdfUri || !pdfName) {
        alert('Please select a PDF first.');
        return;
      }

      setUploading(true);

      const file = {
        uri: pdfUri,
        type: 'application/pdf',
        name: pdfName,
      };

      const formData = new FormData();
      formData.append('files', file);

      const res = await fetch(`${ngrokURL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await res.json();

      if (!res.ok || !data || !data[0]?.pdf_id) {
        alert(data[0]?.error || 'Upload failed');
        setPdfUploaded(false);
      } else {
        const uploadedId = data[0].pdf_id;
        setPdfId(uploadedId);
        setPdfUploaded(true);
      }
    } catch (err) {
      alert('Error uploading PDF');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const askQuestion = async () => {
    if (!pdfUploaded || !pdfId) {
      setAnswer('Please upload a PDF first.');
      return;
    }

    try {
      setAsking(true);

      const formData = new FormData();
      formData.append('pdf_id', pdfId);
      formData.append('question', question);

      const res = await fetch(`${ngrokURL}/ask`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setAnswer(res.ok ? data.response : data.error || 'Error fetching answer.');
    } catch (err) {
      console.error(err);
      setAnswer('Failed to connect to server.');
    } finally {
      setAsking(false);
    }
  };

  const renderQAView = () => (
    <View>
      <Text style={styles.heading}>PDF Question Answering</Text>

      <Button title="Pick a PDF" onPress={pickPDF} />
      {pdfName ? <Text style={styles.pdfName}>Selected: {pdfName}</Text> : null}

      <View style={styles.space} />
      <Button
        title={uploading ? 'Uploading...' : 'Upload PDF'}
        onPress={uploadPDF}
        disabled={uploading}
      />

      {!pdfUploaded && pdfName && (
        <Text style={styles.warning}>Please upload the selected PDF to continue.</Text>
      )}

      <TextInput
        placeholder="Type your question here"
        value={question}
        onChangeText={setQuestion}
        style={styles.input}
        editable={!uploading && pdfUploaded}
      />

      <Button
        title={asking ? 'Asking...' : 'Ask'}
        onPress={askQuestion}
        disabled={asking || !question || !pdfUploaded}
      />

      {answer && (
        <ScrollView style={styles.answerBox}>
          <Text style={styles.answerText}>{answer}</Text>
        </ScrollView>
      )}
    </View>
  );

  const renderContent = () => {
    if (view === 'qa') return renderQAView();
    if (view === 'pomodoro') return <PomodoroScreen />;
    if (view === 'tasks') return <TasksScreen />;
  };

  return (
    <View style={styles.container}>
      {/* Top Menu */}
      <View style={styles.menu}>
        <TouchableOpacity onPress={() => setView('qa')}>
          <Text style={view === 'qa' ? styles.activeTab : styles.tab}>PDF Q&A</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView('pomodoro')}>
          <Text style={view === 'pomodoro' ? styles.activeTab : styles.tab}>Pomodoro</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView('tasks')}>
          <Text style={view === 'tasks' ? styles.activeTab : styles.tab}>Tasks</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 50 : 70,
    backgroundColor: 'black',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    paddingHorizontal: 20,
  },
  pdfName: {
    marginTop: 10,
    fontStyle: 'italic',
    color: 'red',
    paddingHorizontal: 20,
  },
  space: {
    marginVertical: 10,
  },
  input: {
    marginTop: 30,
    marginHorizontal: 20,
    padding: 12,
    fontSize: 16,
    borderWidth: 6,
    borderColor: 'orange',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  warning: {
    color: 'red',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  answerBox: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderColor: 'orange',
    borderWidth: 6,
  },
  answerText: {
    fontSize: 16,
    lineHeight: 22,
    color: 'violet',
  },
  menu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  tab: {
    color: 'gray',
    fontSize: 16,
  },
  activeTab: {
    color: 'orange',
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
