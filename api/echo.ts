interface ErrorObject {
  error: string;
}

function echo(
  value: string
) : ErrorObject | { value: string } {
  if (value === 'echo') {
    throw new Error('You cannot echo the word echo itself');
  }

  return { value };
}

export { echo };

