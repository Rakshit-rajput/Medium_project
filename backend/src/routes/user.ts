import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign} from 'hono/jwt'

import { Hono } from 'hono';
// import { signupInput } from '@rakshitrajput212/medium-common';

export const userRouter = new Hono<{
    Bindings:{
        DATABASE_URL:string;
        JWT_SECRET:string;
    }
}>();

userRouter.post('/signup',async(c)=>{
  const body = await c.req.json();
  // const {success} = signupInput.safeParse(body);
  // if(!success){
  //   c.status(411);
  //   return c.json({
  //     message:"inputs not correct"
  //   })
  // }
  const prisma = new PrismaClient({
    datasourceUrl:c.env?.DATABASE_URL,
  }).$extends(withAccelerate())
  
  
  
  
  
  try {
    const user = await prisma.user.create({
      
      data:{
        email:body.email,
        name:body.name,
        password:body.password
      }
    });
    //create token
    const token = await sign({id:user.id},c.env.JWT_SECRET);
    return c.json({token});
  } catch (error) {
    console.log(error);
    c.status(403);
    return c.json({error:"error while signing up"},500);
  }
  
})
userRouter.post('/signin',async(c)=>{
  const prisma = new PrismaClient({
    datasourceUrl:c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const user = await prisma.user.findUnique({
    where:{
      email:body.email
    }
  })
  if(!user){
    c.status(403);
    return c.json({error:"user not found"})
  }
  const jwt = await sign({id:user.id},c.env.JWT_SECRET);
  return c.json({jwt});
})