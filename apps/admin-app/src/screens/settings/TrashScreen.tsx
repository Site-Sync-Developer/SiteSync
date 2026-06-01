import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trashService, type TrashProject, type TrashUser } from '@staff4dshire/shared';

type Tab = 'projects' | 'users';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function TrashScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['trash'],
    queryFn: () => trashService.getAll(),
  });

  const restoreProject = useMutation({
    mutationFn: (id: string) => trashService.restoreProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      Alert.alert('Restored', 'Project has been restored.');
    },
    onError: () => Alert.alert('Error', 'Could not restore project.'),
  });

  const restoreUser = useMutation({
    mutationFn: (id: string) => trashService.restoreUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      Alert.alert('Restored', 'User has been restored.');
    },
    onError: () => Alert.alert('Error', 'Could not restore user.'),
  });

  const confirmRestore = (label: string, onConfirm: () => void) => {
    Alert.alert('Restore item', `Restore "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', onPress: onConfirm },
    ]);
  };

  const projects: TrashProject[] = data?.projects ?? [];
  const users: TrashUser[] = data?.users ?? [];
  const isPending = restoreProject.isPending || restoreUser.isPending;

  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'projects' && styles.tabActive]}
          onPress={() => setActiveTab('projects')}
        >
          <Text style={[styles.tabText, activeTab === 'projects' && styles.tabTextActive]}>
            Projects {projects.length > 0 ? `(${projects.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Users {users.length > 0 ? `(${users.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#4a026f" />
      ) : isError ? (
        <Text style={styles.empty}>Could not load recycle bin.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {activeTab === 'projects' && (
            <>
              {projects.length === 0 ? (
                <Text style={styles.empty}>No deleted projects.</Text>
              ) : (
                projects.map((p) => (
                  <View key={p.id} style={styles.card}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{p.name}</Text>
                      {p.address ? (
                        <Text style={styles.cardSub} numberOfLines={1}>{p.address}</Text>
                      ) : null}
                      {p.category ? (
                        <Text style={styles.cardMeta}>{p.category}</Text>
                      ) : null}
                      <Text style={styles.cardDeleted}>Deleted {formatDate(p.deleted_at)}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.restoreBtn, isPending && styles.restoreBtnDisabled]}
                      disabled={isPending}
                      onPress={() => confirmRestore(p.name, () => restoreProject.mutate(p.id))}
                    >
                      <Text style={styles.restoreBtnText}>Restore</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'users' && (
            <>
              {users.length === 0 ? (
                <Text style={styles.empty}>No deleted users.</Text>
              ) : (
                users.map((u) => (
                  <View key={u.id} style={styles.card}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>
                        {u.first_name} {u.last_name}
                      </Text>
                      <Text style={styles.cardSub}>{u.email}</Text>
                      <Text style={styles.cardMeta}>{u.role}</Text>
                      <Text style={styles.cardDeleted}>Deleted {formatDate(u.deleted_at)}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.restoreBtn, isPending && styles.restoreBtnDisabled]}
                      disabled={isPending}
                      onPress={() =>
                        confirmRestore(
                          `${u.first_name} ${u.last_name}`.trim() || u.email,
                          () => restoreUser.mutate(u.id)
                        )
                      }
                    >
                      <Text style={styles.restoreBtnText}>Restore</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a026f',
  },
  tabText: { fontSize: 14, color: '#897c98', fontWeight: '600' },
  tabTextActive: { color: '#4a026f' },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#897c98', marginTop: 40, fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardInfo: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  cardSub: { fontSize: 13, color: '#555', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: '#897c98', marginBottom: 2 },
  cardDeleted: { fontSize: 11, color: '#c62828', marginTop: 2 },
  restoreBtn: {
    backgroundColor: '#4a026f',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  restoreBtnDisabled: { opacity: 0.6 },
  restoreBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
