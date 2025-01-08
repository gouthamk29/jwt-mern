import { Alert, AlertIcon, Box, Button, FormControl, FormLabel, Heading, Input, Stack } from "@chakra-ui/react";
import { Link as ChakraLink } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { resetPassword } from "../lib/api";
import { useState } from "react";

// eslint-disable-next-line react/prop-types
const ResetPasswordForm = ({code})=>{
    const [password,setPassword] =useState('');

    const {
        mutate:resetUserPassword,
        isPending,
        isSuccess,
        error,
        isError,
    }=
    useMutation({
        mutationFn:resetPassword,
    })

    return <>
        <Heading fontSize='4xl' mb={8}>
            Change your Password
        </Heading>
        <Box  rounded='lg' bg='gray.700' boxShadow='lg' p={8}>
            {
                isError && (
                    <Box mb={3} color='red.400'>
                    {error.message || ""} 
                </Box>
                )
            }
            {
                isSuccess ? <Box>
                    <Alert status='success' borderRadius={12}>
                        <AlertIcon/>
                        Password reset success
                    </Alert>

                    <ChakraLink as={Link} to="/login" replace>
                        sign in
                    </ChakraLink>
                </Box> :
                <Stack spacing={4}>
                    <FormControl id='password'>
                        <FormLabel>New password</FormLabel>
                        <Input type='password'
                            value={password} 
                            onChange={(e)=>setPassword(e.target.value)}
                            onKeyDown= {
                                (e)=>e.key==='Enter' && resetUserPassword({password,verificationCode:code})
                                       }    
                            autoFocus  
                        />
                    </FormControl>
                    <Button my={2} isDisabled={!password || password.length<6}
                        onClick={
                            ()=>resetUserPassword({password,verificationCode:code})
                                }
                        isLoading={isPending}
                        >
                           Reset password 
                        </Button>
                </Stack>
            }
        </Box>

    </>
}

export default ResetPasswordForm;
