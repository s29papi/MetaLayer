
import {detectFileCtxFromName, validateOGFileCtx} from "../src/utils"

async function main() {
    let ctx = detectFileCtxFromName("../test.txt", "0x330cA32b71b81Ea2b1D3a5C391C5cFB6520E0A10");
    
    console.log(validateOGFileCtx(ctx))

    ctx = detectFileCtxFromName("../video.mp4", "0x330cA32b71b81Ea2b1D3a5C391C5cFB6520E0A10");
    
    console.log(validateOGFileCtx(ctx))
}

main()