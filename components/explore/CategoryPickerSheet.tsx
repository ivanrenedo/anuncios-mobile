import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/constants/theme';
import SwipeableSheet from '@/components/SwipeableSheet';
import { useSheetStyles } from './sheetStyles';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface CategoryNode {
  id: string;
  label: string;
  children?: CategoryNode[];
}

interface Props {
  visible: boolean;
  tree: CategoryNode[];
  /** Label of the currently active category (matches CategoryTree labels). */
  active: string;
  /** Called with the chosen category label ('Todos' resets). */
  onChange: (label: string) => void;
  onClose: () => void;
}

/** Two-level drill-down category picker used by Explore's filter drawer.
 *  Root list first; tapping a root with children reveals its subcategories
 *  with a ‹ Volver and a "Toda la categoría X" option. */
export default function CategoryPickerSheet({
  visible,
  tree,
  active,
  onChange,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const styles = useSheetStyles();
  const { height, isLandscape } = useResponsiveLayout();
  const [root, setRoot] = useState<CategoryNode | null>(null);

  const close = () => {
    setRoot(null);
    onClose();
  };
  const choose = (label: string) => {
    onChange(label);
    close();
  };

  return (
    <SwipeableSheet
      visible={visible}
      onClose={close}
      title={root ? root.label : 'Categoría'}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: height * (isLandscape ? 0.72 : 0.58) }}>
        {!root ? (
          <>
            <TouchableOpacity
              style={styles.option}
              activeOpacity={0.7}
              onPress={() => choose('Todos')}>
              <Text style={[styles.optionText, active === 'Todos' && styles.optionActive]}>
                Todos
              </Text>
              {active === 'Todos' && (
                <Check size={18} color={colors.primary} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
            {tree.map((r) => {
              const isActive = active === r.label;
              const hasChildren = (r.children ?? []).length > 0;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={styles.option}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (hasChildren) setRoot(r);
                    else choose(r.label);
                  }}>
                  <Text style={[styles.optionText, isActive && styles.optionActive]}>
                    {r.label}
                  </Text>
                  {hasChildren ? (
                    <ChevronRight size={18} color={colors.onSurfaceVariant} strokeWidth={1.8} />
                  ) : isActive ? (
                    <Check size={18} color={colors.primary} strokeWidth={2.2} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.option}
              activeOpacity={0.7}
              onPress={() => setRoot(null)}>
              <Text style={[styles.optionText, { color: colors.primary }]}>
                ‹ Volver
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.option}
              activeOpacity={0.7}
              onPress={() => choose(root.label)}>
              <Text style={[styles.optionText, active === root.label && styles.optionActive]}>
                Toda la categoría «{root.label}»
              </Text>
              {active === root.label && (
                <Check size={18} color={colors.primary} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
            {(root.children ?? []).map((c) => {
              const isActive = active === c.label;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.option}
                  activeOpacity={0.7}
                  onPress={() => choose(c.label)}>
                  <Text style={[styles.optionText, isActive && styles.optionActive]}>
                    {c.label}
                  </Text>
                  {isActive && <Check size={18} color={colors.primary} strokeWidth={2.2} />}
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SwipeableSheet>
  );
}
