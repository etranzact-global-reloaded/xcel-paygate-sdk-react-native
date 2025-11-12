# Picker Troubleshooting Guide

## Issue: Can't Select Product from Picker

### Symptoms
- Picker appears on screen
- Can tap/click on picker
- Dropdown may or may not open
- Selection doesn't change or update

### Solutions

### 1. Check Console Logs

Open Metro bundler console and check for:
```
=== Fetching Merchant Products ===
Found 2 products
Auto-selected product: ENEO PREPAID ELECTRICITY
Selected product: 6RgglQWWO  ← Should appear when tapping picker
```

If you don't see "Selected product" when tapping, the Picker isn't firing `onValueChange`.

### 2. Platform-Specific Issues

#### iOS
The picker might not be visible or interactive. Try these fixes:

**Option A: Make sure picker has proper height**
```typescript
picker: {
  width: '100%',
  height: 50,  // Minimum 44pt for iOS
  color: '#000',
}
```

**Option B: Use `itemStyle` for iOS**
```tsx
<Picker
  selectedValue={selectedProductId || ''}
  onValueChange={(itemValue) => setSelectedProductId(itemValue)}
  itemStyle={{ height: 100, fontSize: 16 }}  // iOS only
  style={styles.picker}>
```

#### Android
The picker might not show the dropdown properly.

**Option A: Add `mode="dropdown"`**
```tsx
<Picker
  selectedValue={selectedProductId || ''}
  onValueChange={(itemValue) => setSelectedProductId(itemValue)}
  mode="dropdown"  // Makes it a proper dropdown on Android
  style={styles.picker}>
```

**Option B: Add explicit `dropdownIconColor`**
```tsx
<Picker
  selectedValue={selectedProductId || ''}
  onValueChange={(itemValue) => setSelectedProductId(itemValue)}
  mode="dropdown"
  dropdownIconColor="#007AFF"  // Makes icon visible
  style={styles.picker}>
```

### 3. Value Type Issues

Make sure value types match:

**Problem**: Passing `null` as default value
```tsx
// ❌ Bad
<Picker selectedValue={selectedProductId}>  // null by default
  <Picker.Item label="Select" value={null} />
```

**Solution**: Use empty string instead
```tsx
// ✅ Good
<Picker selectedValue={selectedProductId || ''}>
  <Picker.Item label="Select" value="" enabled={false} />
```

### 4. State Update Issues

Make sure state updates properly:

```tsx
onValueChange={(itemValue) => {
  console.log('Selected:', itemValue);  // Add logging
  if (itemValue && itemValue !== '') {
    setSelectedProductId(itemValue);
  }
}}
```

Check console - you should see the selected value logged.

### 5. Container Styling Issues

The picker container might be blocking touches:

```typescript
pickerContainer: {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  marginBottom: 16,
  overflow: 'hidden',  // Important for Android
  minHeight: 50,       // Minimum touch target
}
```

### 6. Z-Index Issues

If picker is behind other elements:

```typescript
pickerContainer: {
  // ... other styles
  zIndex: 10,
  elevation: 5,  // Android shadow/elevation
}
```

### 7. Test with Simple Picker

Create a test to isolate the issue:

```tsx
// Minimal test picker
<Picker
  selectedValue="test1"
  onValueChange={(value) => alert(`Selected: ${value}`)}>
  <Picker.Item label="Test 1" value="test1" />
  <Picker.Item label="Test 2" value="test2" />
</Picker>
```

If this works, the issue is with your data/state.
If this doesn't work, it's a Picker configuration issue.

### 8. Re-install Picker Package

Sometimes the package needs reinstall:

```bash
# Remove
npm uninstall @react-native-picker/picker

# Clear cache
rm -rf node_modules
rm package-lock.json

# Reinstall
npm install
npm install @react-native-picker/picker

# Restart Metro
npm start -- --reset-cache
```

### 9. Check React Native Version Compatibility

```bash
# Check versions
npm list @react-native-picker/picker
npm list react-native
```

Make sure they're compatible:
- React Native 0.81.4 ✅
- @react-native-picker/picker ^2.11.4 ✅

### 10. Platform-Specific Renders

If all else fails, use platform-specific pickers:

```tsx
import { Platform } from 'react-native';

{Platform.OS === 'ios' ? (
  // iOS Picker with specific props
  <Picker
    selectedValue={selectedProductId}
    onValueChange={setSelectedProductId}
    itemStyle={{ height: 100 }}>
    {/* items */}
  </Picker>
) : (
  // Android Picker with specific props
  <Picker
    selectedValue={selectedProductId}
    onValueChange={setSelectedProductId}
    mode="dropdown"
    dropdownIconColor="#007AFF">
    {/* items */}
  </Picker>
)}
```

## Quick Fixes Checklist

Try these in order:

- [ ] Check console logs for errors
- [ ] Add `mode="dropdown"` to Picker
- [ ] Change default value from `null` to `''`
- [ ] Add explicit width/height to picker
- [ ] Add `enabled={false}` to placeholder item
- [ ] Restart Metro bundler with cache clear
- [ ] Test on different platform (iOS vs Android)
- [ ] Try the minimal test picker above
- [ ] Check if products array is populated
- [ ] Verify `active.status` and `web` are true

## Current Implementation

Here's what should be working:

```tsx
<Picker
  selectedValue={selectedProductId || ''}
  onValueChange={(itemValue) => {
    console.log('Selected product:', itemValue);
    if (itemValue && itemValue !== '') {
      setSelectedProductId(itemValue);
    }
  }}
  style={styles.picker}
  mode="dropdown">

  <Picker.Item label="-- Select Product --" value="" enabled={false} />

  {products
    .filter(p => p.active.status && p.web)
    .map((product) => (
      <Picker.Item
        key={product.product_id}
        label={product.name.trim()}
        value={product.product_id}
        color="#000"
      />
    ))}
</Picker>
```

## Still Not Working?

### Debug Steps

1. **Check products array:**
```tsx
console.log('Products:', products);
console.log('Filtered products:', products.filter(p => p.active.status && p.web));
```

2. **Check selected value:**
```tsx
console.log('Selected product ID:', selectedProductId);
```

3. **Test onValueChange:**
```tsx
onValueChange={(itemValue) => {
  alert(`Selected: ${itemValue}`);
  setSelectedProductId(itemValue);
}}
```

4. **Check Picker is rendering:**
```tsx
{products.length > 0 ? (
  <Picker>{/* ... */}</Picker>
) : (
  <Text>No products available</Text>
)}
```

## Alternative: Use React Native ActionSheet

If Picker continues to have issues, use ActionSheet instead:

```bash
npm install @expo/react-native-action-sheet
```

```tsx
import { useActionSheet } from '@expo/react-native-action-sheet';

const { showActionSheetWithOptions } = useActionSheet();

const handleSelectProduct = () => {
  const options = [
    ...products.map(p => p.name),
    'Cancel'
  ];

  showActionSheetWithOptions(
    {
      options,
      cancelButtonIndex: options.length - 1,
    },
    (selectedIndex) => {
      if (selectedIndex < products.length) {
        setSelectedProductId(products[selectedIndex].product_id);
      }
    }
  );
};

<Pressable onPress={handleSelectProduct}>
  <Text>{selectedProduct?.name || 'Select Product'}</Text>
</Pressable>
```

## Need More Help?

If none of these solutions work:

1. Share screenshot of the picker
2. Share console logs
3. Specify platform (iOS/Android/Web)
4. Share React Native version
5. Share @react-native-picker/picker version

Open an issue with this information! 🐛
