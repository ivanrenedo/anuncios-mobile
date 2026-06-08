import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Camera, Tag, MapPin, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

const categories = ['Moda', 'Tech', 'Coches', 'Hogar', 'Servicios', 'Otros'];

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Publicar anuncio</Text>

      {/* Photo upload area */}
      <TouchableOpacity style={styles.photoArea} activeOpacity={0.8}>
        <Camera size={36} color={colors.outlineVariant} strokeWidth={1} />
        <Text style={styles.photoLabel}>Añadir fotos</Text>
        <Text style={styles.photoHint}>Hasta 8 imágenes</Text>
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Título</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="¿Qué vendes?"
          placeholderTextColor={colors.outlineVariant}
        />
      </View>

      {/* Price */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Precio (XAF)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="0"
          placeholderTextColor={colors.outlineVariant}
          keyboardType="numeric"
        />
      </View>

      {/* Category */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Categoría</Text>
        <View style={styles.chips}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCat === cat && styles.chipActive]}
              onPress={() => setSelectedCat(cat)}
              activeOpacity={0.8}>
              <Text style={[styles.chipText, selectedCat === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Location */}
      <TouchableOpacity style={styles.row} activeOpacity={0.8}>
        <MapPin size={20} color={colors.primary} strokeWidth={1.5} />
        <Text style={styles.rowText}>Seleccionar ubicación</Text>
        <ChevronRight size={18} color={colors.outlineVariant} strokeWidth={1.5} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.publishBtn} activeOpacity={0.88}>
        <Text style={styles.publishText}>Publicar ahora</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 24,
  },
  pageTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 28,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  photoArea: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant + '66',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
  },
  photoLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: colors.onSurfaceVariant,
  },
  photoHint: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.outlineVariant,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Manrope-Regular',
    fontSize: 17,
    color: colors.onSurface,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  chipActive: {
    backgroundColor: colors.primaryContainer + '33',
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    fontFamily: 'Manrope-SemiBold',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '4d',
  },
  rowText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 17,
    color: colors.onSurface,
    flex: 1,
  },
  publishBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  publishText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 17,
    color: '#ffffff',
  },
});
