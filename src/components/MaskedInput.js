import React from 'react';
import InputMask from 'react-input-mask';

// Este componente usa React.forwardRef para passar a 'ref' diretamente para o input.
// Isso evita que o InputMask precise usar o findDOMNode, que foi descontinuado.
const MaskedInput = React.forwardRef((props, ref) => {
  return (
    <InputMask {...props}>
      {(inputProps) => <input {...inputProps} ref={ref} />}
    </InputMask>
  );
});

export default MaskedInput;