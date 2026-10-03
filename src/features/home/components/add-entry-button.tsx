import { Plus } from "lucide-react-native";
import { Pressable, StyleSheet } from 'react-native';
export function AddEntryButton() {
  return (
    <Pressable style={styles.addButton}>
      <Plus color="#FFFFFF" size={39} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 10,
    width: 61,
    height: 61,
    borderRadius: 31,
    backgroundColor: '#5856E8',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#5856E8',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,

    elevation: 6,
  },

  addButtonText: {
    marginTop: -4,
    fontSize: 39,
    fontWeight: '300',
    color: '#FFFFFF',
  },
});
