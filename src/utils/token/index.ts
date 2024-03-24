import { sign, verify } from 'jsonwebtoken'
export const token = {
    createToken: (data: any, time: string = String(24*60 * 60 * 1000)) => {
        let token = sign({ ...data }, process.env.PRIVATE_KEY, { expiresIn: time });
        return token;
    },
    decodeToken: (tokenCode: string) => {
        try {
            let data = verify(tokenCode, process.env.PRIVATE_KEY)
            if (data) {
                return data
            }
            return false
        } catch (err) {
            console.log("err_decodeTOken", err);
            return false
        }


    }
}