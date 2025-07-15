class CustomError extends Error {
  constructor(statusCode, title, description, err) {
    //call the constructor of the Error class and specify it's message
    super(title);

    this.status = statusCode;
    this.title = title;
    this.details = description;
    this.errorFields = []; //For multiple issues with the request body
    this.err = err; // For the actual error body

    Error.captureStackTrace(this, this.constructor);
  }
  setErrors(errorObjArray) {
    this.errorFields = errorObjArray;
  }
  //Return everything except the actual error messages that weren't user specified
  returnErrors() {
    return {
      status: this.status,
      title: this.title,
      details: this.details,
      errorFields: this.errorFields,
    };
  }
}

module.exports = CustomError;
