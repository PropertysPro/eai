import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('Basic Test Setup', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Text>Hello World</Text>);
    expect(getByText('Hello World')).toBeTruthy();
  });
}); 