import {Code} from "@chakra-ui/react";

export default function PieceItemCurrentAssetId({item}) {
    const found = item?.uploads?.find(x => x.fileHash === item.fileHash)

    if (!found) {
        return null
    }

    return (
        <Code colorPalette="blue">
            rbxassetid://
            {found.assetId}
        </Code>
    )
}
