import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity, Switch } from 'react-native';

// Dummy data for categories and priorities
const categories = ['Work', 'Personal', 'Shopping'];
const priorities = ['Low', 'Medium', 'High'];

// Main Task Manager Component
export default function TaskManagerApp() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Work');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [taskProgress, setTaskProgress] = useState(0);

  // Add task function
  const addTask = () => {
    if (taskTitle.trim()) {
      const newTask = {
        id: tasks.length + 1,
        title: taskTitle,
        description: taskDescription,
        category: selectedCategory,
        priority: selectedPriority,
        dueDate,
        progress: taskProgress,
        isCompleted: false,
      };
      setTasks([...tasks, newTask]);
      setTaskTitle('');
      setTaskDescription('');
      setDueDate('');
    }
  };

  // Toggle task completion
  const toggleCompletion = (taskId: number) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );
    setTasks(updatedTasks);
  };

  // Render task item
  const renderTaskItem = ({ item }: { item: any }) => (
    <View style={[styles.taskContainer, item.isCompleted && styles.completedTask]}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text>{item.description}</Text>
      <Text>Category: {item.category}</Text>
      <Text>Priority: {item.priority}</Text>
      <Text>Due Date: {item.dueDate}</Text>
      <View style={styles.progressContainer}>
        <Text>Progress: {item.progress}%</Text>
        <Button title="Complete" onPress={() => toggleCompletion(item.id)} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.darkMode]}>
      <Text style={styles.header}>Task Manager</Text>
      
      {/* Dark Mode Switch */}
      <View style={styles.switchContainer}>
        <Text>Dark Mode</Text>
        <Switch value={isDarkMode} onValueChange={(value) => setIsDarkMode(value)} />
      </View>

      {/* Task Input Section */}
      <TextInput
        style={styles.input}
        placeholder="Task Title"
        value={taskTitle}
        onChangeText={setTaskTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Task Description"
        value={taskDescription}
        onChangeText={setTaskDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Due Date (YYYY-MM-DD)"
        value={dueDate}
        onChangeText={setDueDate}
      />
      
      {/* Category Selector */}
      <View style={styles.selectorContainer}>
        <Text>Category</Text>
        <View style={styles.selector}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Priority Selector */}
      <View style={styles.selectorContainer}>
        <Text>Priority</Text>
        <View style={styles.selector}>
          {priorities.map((priority) => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.priorityButton,
                selectedPriority === priority && styles.selectedPriority,
              ]}
              onPress={() => setSelectedPriority(priority)}
            >
              <Text>{priority}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Add Task Button */}
      <Button title="Add Task" onPress={addTask} />

      {/* Task List */}
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  darkMode: {
    backgroundColor: '#333',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryButton: {
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  priorityButton: {
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  selectedCategory: {
    backgroundColor: '#ddd',
  },
  selectedPriority: {
    backgroundColor: '#ddd',
  },
  taskContainer: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  completedTask: {
    backgroundColor: '#e0e0e0',
  },
  taskTitle: {
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 10,
  },
});
