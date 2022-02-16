import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import {
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Modal,
  ModalBody,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalOverlay,
  useToast,
  useColorModeValue,
  Box,
  Text,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { SERVER_URL as serverUrl } from "../constants";
import useSignedRequest from "../hooks/useSignedRequest";
import useConnectedAddress from "../hooks/useConnectedAddress";

export default function SubmitBuildModal({ isOpen, onClose }) {
  const address = useConnectedAddress();

  // Submission state.
  const [buildName, setBuildName] = useState("");
  const [description, setDescription] = useState("");
  const [buildUrl, setBuildUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState({ buildName: false, description: false, buildUrl: false, imageUrl: false });

  const { isLoading, makeSignedRequest } = useSignedRequest("buildSubmit", address);

  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    accept: "image/*",
    multiple: false,
    onDrop: async droppedFiles => {
      if (!droppedFiles.length) {
        return;
      }

      const file = droppedFiles[0];

      const formData = new FormData();
      formData.append("imageFile", file);

      let response;
      try {
        setIsUploadingImg(true);
        response = await axios.post(serverUrl + "/builds/upload-img", formData, {
          headers: { "content-type": "multipart/form-data", address },
        });
      } catch (error) {
        console.log(error);
      } finally {
        setIsUploadingImg(false);
      }

      setImageUrl(response.data.imgUrl);
    },
  });

  const toast = useToast({ position: "top", isClosable: true });
  const toastVariant = useColorModeValue("subtle", "solid");

  const clearForm = () => {
    setBuildName("");
    setDescription("");
    setBuildUrl("");
    setImageUrl("");
  };

  const handleSubmit = async () => {
    const nextErrors = {
      buildName: !buildName,
      description: !description,
      buildUrl: !buildUrl,
      imageUrl: false,
    };

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(hasError => hasError)) {
      return;
    }

    try {
      await makeSignedRequest({ buildUrl, desc: description, image: imageUrl, name: buildName });
    } catch (error) {
      toast({
        description: error.message,
        status: "error",
        variant: toastVariant,
      });
      return;
    }

    toast({
      status: "success",
      description: "Build submitted! You can see it in your portfolio.",
      variant: toastVariant,
    });

    clearForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New Build</ModalHeader>
        <ModalCloseButton />
        <ModalBody px={8} pb={8}>
          <FormControl mb={4} isRequired isInvalid={errors.buildName}>
            <FormLabel htmlFor="buildName">
              <strong>Build name</strong>
            </FormLabel>
            <Input
              id="buildName"
              placeholder="Build name"
              value={buildName}
              onChange={evt => setBuildName(evt.target.value)}
            />
            <FormErrorMessage>This field is required</FormErrorMessage>
          </FormControl>
          <FormControl mb={4} isRequired isInvalid={errors.description}>
            <FormLabel htmlFor="description">
              <strong>Description</strong>
            </FormLabel>
            <Textarea
              id="description"
              placeholder="Write a short description for this build.&#10;(Please include searchable keywords)"
              value={description}
              onChange={evt => setDescription(evt.target.value)}
            />
            <FormErrorMessage>This field is required</FormErrorMessage>
          </FormControl>
          <FormControl mb={4} isRequired isInvalid={errors.buildUrl}>
            <FormLabel htmlFor="buildUrl">
              <strong>Public Repo URL</strong>
            </FormLabel>
            <Input
              id="buildUrl"
              placeholder="https://..."
              value={buildUrl}
              onChange={evt => setBuildUrl(evt.target.value)}
            />
            <FormErrorMessage>This field is required</FormErrorMessage>
          </FormControl>
          <FormControl mb={4} isInvalid={errors.imageUrl}>
            <FormLabel htmlFor="imageUrl">
              <strong>
                Image{" "}
                {imageUrl && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setImageUrl(null);
                    }}
                  >
                    ( Remove
                    <span role="img" aria-label="cross icon">
                      ❌
                    </span>
                    )
                  </Button>
                )}
              </strong>
            </FormLabel>
            <Box
              textAlign="center"
              borderStyle="dashed"
              p="20px"
              borderWidth="2px"
              borderColor={isDragAccept ? "green.200" : isDragReject ? "red.200" : "gray.200"}
              {...getRootProps({ className: "dropzone" })}
            >
              <Input id="imageUrl" {...getInputProps()} />
              {isUploadingImg && <Spinner />}
              {imageUrl ? (
                <Image boxSize="100px" objectFit="cover" src={imageUrl} />
              ) : (
                <Text fontSize="sm" color="">
                  Drag & drop or click to select the image
                </Text>
              )}
            </Box>
          </FormControl>
          <Button colorScheme="blue" mt={8} px={4} onClick={handleSubmit} isLoading={isLoading} isFullWidth>
            Submit
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
