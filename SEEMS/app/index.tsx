import { Text, View, StyleSheet, ImageBackground } from "react-native";

export default function Index() {
  return (
    <View style= {styles.container} >
      <Text style = {styles.text}>Edit app/index.tsx to edit this screen.</Text>
    </View>
  ); 
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e" , 
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#FFF",
  },
});