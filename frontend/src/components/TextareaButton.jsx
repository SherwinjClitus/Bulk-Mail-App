import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

export function TextareaButton() {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  const MAX_MESSAGE_LENGTH = 5000;

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(false);
  const [emailList, setEmailList] = useState([]);

  const [messageError, setMessageError] = useState("");
  const [fileError, setFileError] = useState("");
  const [fileInfo, setFileInfo] = useState("");

  function handleMessage(event) {
    const value = event.target.value;
    setMessage(value);

    if (value.length > MAX_MESSAGE_LENGTH) {
      setMessageError(
        `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
      );
    } else {
      setMessageError("");
    }
  }
  function send() {
    // 1. check again at the moment of clicking
    if (!message.trim()) {
      setMessageError("Please type a message before sending.");
      return;
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return;
    }
    if (emailList.length === 0) {
      setFileError("Please upload an Excel file with valid emails.");
      return;
    }

    // 2. lock the button
    setStatus(true);

    axios
      .post("http://localhost:5000/sendmail", {
        message: message.trim(),
        emailList: emailList,
      })
      .then(function (res) {
        if (res.data.success === true) {
          alert("Emails Sent Successfully :)");
          setMessage("");
          setEmailList([]);
          setFileInfo("");
        } else {
          alert(res.data.error || "Failed to Send Emails !!!");
        }
      })
      .catch(function (error) {
        const serverMessage = error.response?.data?.error;
        alert(serverMessage || "Something went wrong. Please try again.");
      })
      .finally(function () {
        setStatus(false);
      });
  }
  function handleFile(event) {
    // 1. reset old results
    setFileError("");
    setFileInfo("");
    setEmailList([]);

    const file = event.target.files[0];

    // 2. was a file chosen?
    if (!file) {
      setFileError("Please choose an Excel file.");
      return;
    }

    // 3. is it the right type?
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      setFileError("Only .xlsx or .xls files are allowed.");
      event.target.value = "";
      return;
    }

    // 4. is it too big?
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File is too large. Maximum size is 2 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();

    reader.onerror = function () {
      setFileError("Could not read the file. Please try again.");
    };

    reader.onload = function (e) {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setFileError("The Excel file has no sheets.");
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: "A" });

        // take column A, make it text, trim spaces, drop blanks
        const allValues = rows
          .map(function (row) {
            return row.A ? String(row.A).trim() : "";
          })
          .filter(function (value) {
            return value !== "";
          });

        // keep only valid emails, remove duplicates
        const validEmails = [
          ...new Set(
            allValues.filter(function (value) {
              return EMAIL_REGEX.test(value);
            }),
          ),
        ];
        const skipped = allValues.length - validEmails.length;

        if (validEmails.length === 0) {
          setFileError("No valid email addresses found in column A.");
          return;
        }

        setEmailList(validEmails);
        setFileInfo(
          validEmails.length +
            " valid email(s) found" +
            (skipped > 0
              ? ", " + skipped + " invalid/duplicate skipped."
              : "."),
        );
      } catch (error) {
        console.log(error);
        setFileError("This is not a valid Excel file.");
      }
    };

    reader.readAsBinaryString(file);
  }

  const canSend =
    !status &&
    message.trim() !== "" &&
    message.length <= MAX_MESSAGE_LENGTH &&
    emailList.length > 0;

  return (
    <div className="grid w-full grid-cols-1 gap-5">
      {/* Email Message */}
      <Field className="min-w-0">
        <FieldLabel htmlFor="message">Email Message</FieldLabel>
        <Textarea
          id="message"
          placeholder="Enter your email message here..."
          className="min-h-24 max-h-60 w-full min-w-0 overflow-y-auto field-sizing-fixed wrap-anywhere"
          onChange={handleMessage}
          value={message}
        />
        {messageError && <p className="text-sm text-red-500">{messageError}</p>}
      </Field>

      {/* Excel File Upload */}
      <Field className="min-w-0">
        <FieldLabel htmlFor="excel">Upload Excel File</FieldLabel>
        <Input
          id="excel"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="file:mr-3 file:border-r file:border-white/20 file:pr-3 text-muted-foreground"
        />
        <FieldDescription>
          Select an Excel file containing email addresses.
        </FieldDescription>
        {fileError && <p className="text-sm text-red-500">{fileError}</p>}
        {fileInfo && <p className="text-sm text-green-600">{fileInfo}</p>}
      </Field>
      <p>Total Emails in the field :{emailList.length}</p>

      {/* Send Button */}
      <Button
        className="w-full hover:cursor-pointer disabled:cursor-not-allowed"
        onClick={send}
        disabled={!canSend}
      >
        {status ? "Sending mail" : "Send mail"}
      </Button>
    </div>
  );
}
