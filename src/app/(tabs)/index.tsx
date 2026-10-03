import { StyleSheet, Text, View } from 'react-native';

export default function Screen() {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Chat App</Text>
    </View>
  )
}



const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
});
