import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Send, Mic, Image as ImageIcon } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading = false,
  placeholder = "Type a message..."
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    
    onSend(inputText);
    setInputText('');
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TouchableOpacity style={styles.attachButton}>
          <ImageIcon size={20} color={Colors.textLight} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        
        {inputText.trim() ? (
          <TouchableOpacity 
            style={[
              styles.sendButton,
              isLoading && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive
            ]}
            onPress={() => setIsRecording(!isRecording)}
            disabled={isLoading}
          >
            <Mic size={20} color={isRecording ? '#fff' : Colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 24,
    paddingHorizontal: 12,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: Colors.secondary,
  },
  micButtonActive: {
    backgroundColor: Colors.primary,
  },
});

export default ChatInput;