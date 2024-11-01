export interface ValidationError {
  $uid: string;
  $message: string;
}

export interface Validation {
  [key: string]: {
    $errors: ValidationError[];
    $invalid: boolean;
    $dirty: boolean;
  };
}
