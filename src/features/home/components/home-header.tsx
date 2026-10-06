import { Image, StyleSheet, Text, View } from 'react-native';

export function HomeHeader({
  title,
  subtitle,
  avatarUri,
  avatarLabel = 'K',
}: {
  title: string;
  subtitle: string;
  avatarUri?: string;
  avatarLabel?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.welcome}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {avatarUri ? <Image
        source={{
          uri: avatarUri,
        }}
        style={styles.avatar}
      /> : <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#5856E8' }}>{avatarLabel}</Text>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: {
    flex: 1,
  },

  welcome: {
    fontSize: 29,
    fontWeight: '700',
    color: '#17171A',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#7B7D86',
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ECECEF',
  },
});
